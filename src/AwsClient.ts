// AwsClient.ts
// The main class that handles the logic to AWS

import {
  DescribeInstancesCommand,
  DescribeInstancesRequest,
  DescribeInstancesResult,
  DescribeRegionsCommand,
  DescribeRegionsCommandInput,
  EC2Client
} from '@aws-sdk/client-ec2'
import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm'
import { awsEc2ReturnObject, awsJiraParamaterObject } from './types/awsTypes'

/**
 * @class AwsClient
 * @classdesc Logic to handle getting the data we need from AWS.
 */
export default class AwsClient {
  private regionList: string[] = []
  private ssm_client: SSMClient
  /**
   * Create an instance of the class
   * @constructor
   */
  constructor() {
    this.ssm_client = new SSMClient()
  }

  /**
   * Get the Vanta API token from our AWS Parameter Store
   * @async
   * @returns The Vanta API token from our AWS Parameter Store
   */
  async GetVantaApiToken(): Promise<string> {
    const awsCommand = new GetParameterCommand({ Name: process.env.PS_VANTA_API_KEY, WithDecryption: true })

    let token: string = ''

    await this.ssm_client
      .send(awsCommand)
      .then((response) => {
        if (response.Parameter && response.Parameter.Value) {
          token = response.Parameter.Value
        }
      })
      .catch((err) => {
        console.error(err)
        throw 'There was an error obtaining the Vanta API Token from AWS'
      })

    return token
  }

  /**
   * Get the Jira API information (username & password token)
   * from our AWS Parameter Store
   * @async
   * @returns An object containing the Jira API information needed from
   * the Parameter Store.
   */
  async GetJiraApiInformation(): Promise<awsJiraParamaterObject> {
    const awsCommand = new GetParameterCommand({
      Name: process.env.PS_JIRA_API_INFORMATION_KEY,
      WithDecryption: true
    })

    let jira_api_data: awsJiraParamaterObject = { username: '', password: '' }

    await this.ssm_client
      .send(awsCommand)
      .then((response) => {
        if (response.Parameter && response.Parameter.Value) {
          jira_api_data = JSON.parse(response.Parameter.Value)
        }
      })
      .catch((err) => {
        console.error(err)
        throw 'There was an error obtaining the JIRA API Information from AWS'
      })

    return jira_api_data
  }

  /**
   * This method gets all the regions that we have EC2 instances in. Since the
   * instanceIds we receive from Vanta do not tell us what region they are in,
   * we need to handle the searching ourselves. Since we are able to determine
   * the region from the data coming back from Vanta, not sure of the need of
   * this method any longer. Leaving it for now.
   * @async
   * @returns The list of all regions we have resources in
   */
  private async GetAwsRegions() {
    const eClient: EC2Client = new EC2Client()
    const regionInput: DescribeRegionsCommandInput = {}
    const command: DescribeRegionsCommand = new DescribeRegionsCommand(regionInput)

    try {
      const response = await eClient.send(command)

      if (response.Regions) {
        let tempRegionList: string[] = response.Regions.map((region) => region.RegionName).filter(
          (name): name is string => !!name
        )

        // This will help with performance later on in the process.
        let index: number = tempRegionList.indexOf('us-west-2')

        if (index !== -1) {
          let item: string = tempRegionList.splice(index, 1)[0]
          tempRegionList.unshift(item)
        }

        this.regionList = tempRegionList
      }
    } catch (err) {
      console.error(err)
      throw 'There was an error obtaining the list of regions from AWS'
    }
  }

  /**
   * This function queries AWS to get the EC2 instance information for the list of
   * instance Ids submitted for the given region.
   * @param instanceIds are the list of ids that we need information on from AWS
   * @param region the region where these instances currently reside
   * @param maxResults [optional] the number of results to return per call.
   * @returns
   */
  async GetEC2InstanceInformation(
    instanceIds: string[],
    region: string,
    maxResults: number = 100
  ): Promise<awsEc2ReturnObject[]> {
    const eClient: EC2Client = new EC2Client({ region: region })
    const input: DescribeInstancesRequest = {
      InstanceIds: instanceIds
    }
    const command = new DescribeInstancesCommand(input)

    let response: awsEc2ReturnObject[] = []

    try {
      // returns an AWS API data structure
      const awsData: DescribeInstancesResult = await eClient.send(command)

      // if found data
      if (awsData.Reservations) {
        for (const obj of awsData.Reservations) {
          if (obj.Instances) {
            obj.Instances.forEach((instance) => {
              const instanceName = instance.Tags?.find((tag) => tag.Key === 'Name')
              response.push({
                instanceId: instance?.InstanceId,
                instanceName: instanceName?.Value
              })
            })
          }
        }
      }
    } catch (err) {
      console.error(err)
      throw 'There was an error obtaining the EC2 information for the list of instance Ids from AWS'
    }

    return response
  }
}
