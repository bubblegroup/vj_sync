import AwsClient from './AwsClient'
import { awsJiraParamaterObject, ec2Resource } from './types/awsTypes'
import axios from 'axios'

/**
 * @class JiraClient
 * @description Logic to handle getting the alert data into Jira
 * and specifically, into the Cloud Infra project.
 */
export default class JiraClient {
  private awsClient: AwsClient = new AwsClient()

  async postVulnerabilityIssues(region: string, resources: ec2Resource[]) {
    const api_info: awsJiraParamaterObject = await this.awsClient.GetJiraApiInformation()
    const JIRA_PROJECT_ID = process.env.JIRA_PROJECT_ID as string
    const JIRA_API_URL = process.env.JIRA_API_BASE_URL + 'api/2/issue'

    // Find the earliest dueDate for the resources.
    const earliest_dueDate = resources.reduce((earliest, current) => {
      return current.deadline < earliest.deadline ? current : earliest
    }).deadline

    // map the resources into a user-readable string
    const readableResources = resources.map((resource) => {
      const deadline = new Date(resource.deadline).toLocaleString()
      return `Instance ID: ${resource.instanceId}, Name: ${resource.instanceName}, Deadline: ${deadline}`
    })

    // Now join all the strings into one with newline characters
    const resourceCombined = readableResources.join('\n')

    const contentDetail = 'The following resources need to be updated according to Vanta:\n\n' + resourceCombined

    const auth = {
      username: api_info.username,
      password: api_info.password
    }

    const config = {
      headers: { 'Content-Type': 'application/json' },
      auth: auth
    }

    const data = {
      fields: {
        project: { key: JIRA_PROJECT_ID },
        summary: `Vanta Vulnerability Alerts for EC2s in ${region}`,
        description: contentDetail,
        issuetype: { name: 'Task' },
        duedate: earliest_dueDate
      }
    }

    const response = await axios.post(JIRA_API_URL, data, config)

    const responseData = response.data

    console.info(`Jira Card: ${responseData.key} created for region: ${region}.`)
  }
}
