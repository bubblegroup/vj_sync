import AwsClient from './AwsClient'
import VantaClient from './VantaClient'
import JiraClient from './JiraClient'
import { awsEc2ReturnObject, ec2Resource } from './types/awsTypes'
import { Edge } from './types/vantaAPITypes'
import dotenv from 'dotenv'

dotenv.config()

async function main() {
  const vantaClient: VantaClient = new VantaClient()
  const jiraClient: JiraClient = new JiraClient()

  console.info('Now getting the information from Vanta...')
  let vantaData: Edge[] = await vantaClient.getVulnerableResources()

  // now we map the vanta data to the new datatype we will be using.
  let ec2Resources: ec2Resource[] = vantaData.map((edge) => {
    return {
      instanceId: edge.node.instanceId,
      deadline: edge.node.slaDeadline,
      region: edge.node.awsRegion,
      instanceName: ''
    }
  })

  // Now take the just converted Vanta data and go to AWS to get the
  // remaining information for those resources.
  console.info('Now getting the regions affected by the Vanta findings...')
  const vulnerabilityData = await getEc2sByRegion(ec2Resources)

  //Finally we take the finalized data to create cards in Jira
  console.info('Now taking the finalized data and creating Jira cards for them...')
  for (const region_key in vulnerabilityData) {
    if (vulnerabilityData.hasOwnProperty(region_key)) {
      const resources: ec2Resource[] = vulnerabilityData[region_key]

      try {
        await jiraClient.postVulnerabilityIssues(region_key, resources)
      } catch (err: any) {
        console.error(`Error creating Jira ticket for ${region_key} \n`, err)
      }
    }
  }

  // We are complete
  console.log('The Vanta/Jira sync is complete.')
}

/**
 * Returns all the ec2 information for the given list based on region.
 * @param resourceList is the list of vulnerabilities that was found from Vanta
 * @returns Map of `AWS Region`->`List:EC2 Instances` that need to be updated.
 */
async function getEc2sByRegion(resourceList: ec2Resource[]): Promise<{ [key: string]: ec2Resource[] }> {
  const awsClient: AwsClient = new AwsClient()

  // Extract a list of the unique regions these resources are in
  const regionList = Array.from(new Set(resourceList.map((res) => res.region)))

  // create the object to house all of these arrays
  const ec2sByRegion: { [key: string]: ec2Resource[] } = {}

  // for each unique region that has vulnerable ec2 instances
  for (const region of regionList) {
    if (!region) continue

    // get all the EC2 instances for this region that are affected
    let ec2List = resourceList.filter((edge) => edge.region === region)
    const awsResourceData: awsEc2ReturnObject[] = []

    // list of instance Ids we will getting information on.
    let instanceIds: string[] = ec2List.map((edge) => edge.instanceId)

    // max number of instance Ids we can pass into the AWS API call at once
    let chunkSize: number = 10

    // use our instance ids to fetch additional ec2 metadata
    for (let i = 0; i < instanceIds.length; i += chunkSize) {
      let group = instanceIds.slice(i, i + chunkSize)
      let awsResponse = await awsClient.GetEC2InstanceInformation(group, region, chunkSize)

      awsResourceData.push(...awsResponse)
    }

    /**
     * Merge the AWS data that we just got with the Vanta Data.
     * This map will allow us to quickly reference the AWS data
     * when we are updating the Vanta data.
     */
    const awsMap = new Map<string, string>()
    awsResourceData.forEach((obj) => {
      if (obj.instanceId && obj.instanceName) {
        awsMap.set(obj.instanceId, obj.instanceName)
      }
    })

    // Now update the Vanta data with the AWS data.
    ec2List.forEach((res) => {
      const name = awsMap.get(res.instanceId)

      if (name) {
        res.instanceName = name
      }
    })

    ec2sByRegion[region] = ec2List
  }

  return ec2sByRegion
}

main()
