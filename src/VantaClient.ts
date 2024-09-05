// VantaClient.ts
// The main class that handles the logic between us and Vanta

import { GraphQLClient, gql } from 'graphql-request'
import { AwsInspectorVulnerabilityList, VantaQueryResult, Edge } from './types/vantaAPITypes'
import AwsClient from './AwsClient'

const RESULTS_PER_PAGE = 100 // The max from Vanta is 100
const VANTA_QUERY_STRING = gql`
  query Organization($first: Int, $after: String) {
    organization {
      name
      AwsInspectorVulnerabilityList(first: $first, after: $after) {
        totalCount
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            instanceId
            slaDeadline
            createdAt
            externalURL
          }
        }
      }
    }
  }
`

/**
 * @class VantaClient
 * @description Logic to handle getting the test failures out of Vanta.
 */
export default class VantaClient {
  private token: string = ''
  private awsClient: AwsClient = new AwsClient()
  private readonly urlEndPoint: string = process.env.VANTA_API_URL as string

  /**
   * Create an instance of the class
   */
  constructor() {}

  /**
   * Execute the query to get all existing resources with vulnerabilities
   * from Vanta.
   *
   * Since Vanta has a limit to how much data can be returned in one go,
   * this is done with pagination.
   *
   * @returns an Edge[] containing the resources with vulnerabilities.
   */
  async getVulnerableResources(): Promise<Edge[]> {
    this.token = await this.awsClient.GetVantaApiToken()

    const client = new GraphQLClient(this.urlEndPoint, {
      headers: {
        Authorization: `token ${this.token}`
      }
    })

    try {
      let vulnList: AwsInspectorVulnerabilityList = (
        (await client.request(VANTA_QUERY_STRING, {
          first: RESULTS_PER_PAGE,
          after: null
        })) as VantaQueryResult
      ).organization.AwsInspectorVulnerabilityList

      const resourceList: Edge[] = [...vulnList.edges]

      while (vulnList.pageInfo.hasNextPage) {
        const cursor = vulnList.pageInfo.endCursor

        vulnList = (
          (await client.request(VANTA_QUERY_STRING, {
            first: RESULTS_PER_PAGE,
            after: cursor
          })) as VantaQueryResult
        ).organization.AwsInspectorVulnerabilityList

        resourceList.push(...vulnList.edges)
      }
      const uniqueResourceList = resourceList.filter(
        (edge, i, arr) => arr.findIndex((x) => x.node.instanceId == edge.node.instanceId) === i
      )

      uniqueResourceList.forEach((edge) => {
        edge.node.awsRegion = this.parseRegion(edge.node.externalURL)
      })

      return uniqueResourceList
    } catch (error) {
      console.error(error)
      throw 'There was an error getting the data from Vanta.'
    }
  }

  /**
   * Parses the AWS region from the url provided using a regular expression.
   * @param externalURL the url that Vanta uses to check that resource
   * Ex: "https://console.aws.amazon.com/xyz/v2/home?region=us-west-2#/ex
   * @returns the AWS region out of the url.
   * Ex: "us-west-2"
   */
  parseRegion(externalURL: string): string | null {
    const regExPattern = /region=([a-zA-Z0-9-]+)/
    const match = externalURL.match(regExPattern)
    return match ? match[1] : null
  }
}
