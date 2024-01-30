export interface ec2Resource {
  instanceId: string
  instanceName: string
  deadline: Date
  region: string | null
}

export interface awsEc2ReturnObject {
  instanceId: string | undefined
  instanceName: string | undefined
}

export interface awsJiraParamaterObject {
  username: string
  password_token: string
}
