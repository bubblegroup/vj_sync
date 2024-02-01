# Vanta Alert Sync
A tool that pulls infrastructure vulnerability alterts from [Vanta](https://app.vanta.com) and creates [Jira](https://www.atlassian.com/software/jira) related cards for the Teams to handle. This is currently focused on EC2 instances.

## Usage
Currently, this can be ran locally on an engineer's machine.

## Prerequisites
1. For local development and execution, you will need to make sure that you have AWS SSO setup. 

    - As part of this, you will also need to have AWS SDK and Command Line Access setup.
    - Look at the following [Configure the AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html) website on how to set this up. 
    - When logging into AWS, it is preferred to setup a link to a `Read-Only` role

2. You will need to create a `.env` file that will house specific URLS and Values you will need for this application. This `.env` file will need to be created at the root level of the folder. 

An Example `.env` file
```sh
# Key Names for the API information stored in Parameter Store in AWS
PS_VANTA_API_KEY='The name you used in the Parameter Store to store the Vanta API token'
PS_JIRA_API_INFORMATION_KEY='The name you used in the Parameter Store to store the Jira API information'

# Specific URLs for Vanta and Jira instances.
VANTA_API_URL='Specific url to the Vanta api (currently this is: https://api.vanta.com/graphql)'
JIRA_API_BASE_URL='URL to your company instance of JIRA'

# Jira Project Specifics
JIRA_PROJECT_ID='Project ID for the project you want to add the JIRA cards to'
```

## Getting Started
Once the prerequisites are complete you will need to install the dependencies for the application using

```sh
npm i
```
Note: if you are using VS Code as your IDE and want to debug the application, you will need to log into the AWS command line first, and then open VS Code from that terminal.

## NPM Commands
There are a couple of commands to interact with the application.

To build the application:
```sh
npm run tsc-build
```

To fix linting issues:
```sh
npm run fix-lint
```

To start the application:
```sh
npm start
```

## Console Output Example
Currently, when running this application locally, the application will output the following data structure.
A Map with the key being the AWS region and the value being an array of the instances affected. This will be outputted to the console.

```json
{
  "us-east-1": [  
      {
        "instanceId": "i-xxxxxxx",
        "deadline": "2024-02-14T12:01:51.554Z",
        "region": "us-east-1",
        "instanceName": ""
      },
      {
        "instanceId": "i-xxxxxxx",
        "deadline": "2024-02-14T20:00:58.869Z",
        "region": "us-east-1",
        "instanceName": ""
      }
    ],
}
```

## API Data Structure Examples

### Data Structure from Vanta
```json
{
  "data": {
    "organization": {
      "name": "organization",
      "AwsInspectorVulnerabilityList": {
        "totalCount": 9999,
        "pageInfo": {
          "hasNextPage": true,
          "endCursor": "XXXXXXXXXXX"
        },
        "edges": [
          {
            "node": {
              "instanceId": "i-xxxxxxxxx",
              "slaDeadline": "2024-02-09T14:29:22.112Z",
              "createdAt": "2024-01-10T14:00:55.007Z",
              "externalURL": "https://console.aws.amazon.com/inspector/xxxxxxxx"
            }
          },
          {
            "node": {
              "instanceId": "i-xxxxxxxxxxxx",
              "slaDeadline": "2024-02-09T14:29:22.112Z",
              "createdAt": "2024-01-10T14:00:55.366Z",
              "externalURL": "https://console.aws.amazon.com/inspector/xxxxxxxx"
            }
          }
        ]
      }
    }
  }
}
```
### Data Structure from AWS
Note: The full data structure can be found [here](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/ec2/command/DescribeInstancesCommand/). Only showing the relevant parts for the application.

```json
{
    "$metadata": {
        "httpStatusCode": 200,
        "requestId": STRING_VALUE,
        "attempts": 1,
        "totalRetryDelay": 0
    },
    "Reservations": [
        {
            "Groups": [],
            "Instances": [
                {
                    "AmiLaunchIndex": 0,
                    "ImageId": STRING_VALUE,
                    "InstanceId": "i-xxxxxxxxxxxxx",
                    "InstanceType": "xxxxxx",
                    ...
                    
                    ...
                    
                    "SourceDestCheck": true,
                    "Tags": [
                        ...
                        {
                            "Key": "Name",
                            "Value": "INSTANCE NAME"
                        },
                        {
                            "Key": "Service",
                            "Value": "SERVICE NAME"
                        }
                    ],

                    ...
                    
                }
            ],
            "OwnerId": STRING_VALUE,
            "ReservationId": STRING_VALUE
        }
    ]
}
```

## Documentation

- [Vanta API Explorer](https://studio.apollographql.com/public/vanta-prod/variant/api-external/home)