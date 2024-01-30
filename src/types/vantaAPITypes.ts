export interface VantaQueryResult {
  organization: Organization
}

export interface Organization {
  name: string
  AwsInspectorVulnerabilityList: AwsInspectorVulnerabilityList
}

export interface AwsInspectorVulnerabilityList {
  totalCount: number
  pageInfo: PageInfo
  edges: Edge[]
}

export interface Edge {
  node: Node
}

export interface Node {
  instanceId: string
  slaDeadline: Date
  createdAt: Date
  externalURL: string
  awsRegion: string | null
}

export interface PageInfo {
  hasNextPage: boolean
  endCursor: string
}
