import AwsClient from './AwsClient'
import { awsJiraParamaterObject } from './types/awsTypes'

/**
 * @class JiraClient
 * @description Logic to handle getting the alert data into Jira
 * and specifically, into the Cloud Infra project.
 */
export default class JiraClient {
  private awsClient: AwsClient = new AwsClient()

  async postVulnerabilityIssues() {
    const api_info: awsJiraParamaterObject = await this.awsClient.GetJiraApiInformation()
    console.log(api_info)
  }
}
