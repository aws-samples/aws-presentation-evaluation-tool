import boto3
import os
import json
import time

def handler(context, event):
    print("event: {}".format(event))
    iam = boto3.client('iam')
    sts = boto3.client('sts')
    roleArn = ''
    trustPolicy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "Service": [
                        "apigateway.amazonaws.com",
                        "iam.amazonaws.com",
                        "lambda.amazonaws.com"
                    ]
                },
                "Action": "sts:AssumeRole"
            },
            {
                "Effect": "Allow",
                "Principal": {
                    "AWS": [
                        sts.get_caller_identity()['Arn']
                    ]
                },
                "Action": "sts:AssumeRole"
            }
        ]
    }
    permissionsPolicy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "VisualEditor0",
                "Effect": "Allow",
                "Action": [
                    "comprehend:DescribeSentimentDetectionJob",
                    "comprehend:DescribeTopicsDetectionJob",
                    "comprehend:DetectSentiment",
                    "comprehend:DescribeEntityRecognizer",
                    "comprehend:DescribeDominantLanguageDetectionJob",
                    "comprehend:DescribeDocumentClassificationJob",
                    "comprehend:BatchDetectSentiment",
                    "comprehend:BatchDetectEntities",
                    "comprehend:BatchDetectKeyPhrases",
                    "comprehend:DetectDominantLanguage",
                    "comprehend:DescribeEntitiesDetectionJob",
                    "comprehend:ClassifyDocument",
                    "comprehend:DetectSyntax",
                    "comprehend:DescribeDocumentClassifier",
                    "comprehend:BatchDetectSyntax",
                    "transcribe:StartStreamTranscription",
                    "comprehend:BatchDetectDominantLanguage",
                    "comprehend:DescribeEndpoint",
                    "comprehend:DetectEntities",
                    "transcribe:StartStreamTranscriptionWebSocket",
                    "comprehend:DetectKeyPhrases",
                    "comprehend:DescribeKeyPhrasesDetectionJob"
                ],
                "Resource": "*"
            }
        ]
    }

    try:
        roleArn = iam.get_role(
            RoleName='WellPresentedSTS'
        )
        print(roleArn)
        roleArn = roleArn['Role']['Arn']
    except iam.exceptions.NoSuchEntityException:
        print(sts.get_caller_identity())
        role = iam.create_role(
            RoleName='WellPresentedSTS',
            Description='Role for Transcribe usage',
            MaxSessionDuration=36000,
            AssumeRolePolicyDocument=json.dumps(trustPolicy)
        )
        print(role)
        roleArn = role['Role']['Arn']
        policy = iam.create_policy(
            PolicyName='useTranscribeComprehend',
            PolicyDocument=json.dumps(permissionsPolicy)
        )
        print(policy)
        iam.attach_role_policy(
            RoleName='WellPresentedSTS',
            PolicyArn=policy['Policy']['Arn']
        )
        time.sleep(10)
    except Exception as e:
        print(e)
        return {"statusCode": 500}

    sts = boto3.client('sts' , 
    endpoint_url = 'https://sts.{}.amazonaws.com'.format(os.environ['AWS_REGION'])
    )
    accessCredentials = sts.assume_role(
        RoleArn=roleArn,
        RoleSessionName="access_session_role"
    )['Credentials']
    result = {}
    result['accessKeyId'] = accessCredentials['AccessKeyId']
    result['secretAccessKey'] = accessCredentials['SecretAccessKey']
    result['sessionToken'] = accessCredentials['SessionToken']
    result['region'] = os.environ['AWS_REGION']
    return {
        "isBase64Encoded": False,
        "statusCode": 200,
        'body': json.dumps(result),
        "headers": {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
            }
    }