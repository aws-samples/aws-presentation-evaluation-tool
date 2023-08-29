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
    
    # Set policy or create it if it doesn't exist
    policyArn = ''
    try:
        policyArn = iam.create_policy(
            PolicyName='useTranscribeComprehend',
            PolicyDocument=json.dumps(permissionsPolicy)
        )['Policy']['Arn']
    except iam.exceptions.EntityAlreadyExistsException:
        policyArn = 'arn:aws:iam::' + sts.get_caller_identity()['Account'] + ':policy/useTranscribeComprehend'
    except Exception as e:
        print(e)
        return {"statusCode": 500}
    print('policy:', policyArn)
    
    # Update role or create it if it doesn't exist
    try:
        iam.update_assume_role_policy(
            RoleName='WellPresentedSTS',
            PolicyDocument=json.dumps(trustPolicy)
        )
        print('role updated')
        roleArn = iam.get_role(
            RoleName='WellPresentedSTS'
        )['Role']['Arn']
    except iam.exceptions.NoSuchEntityException:
        print(sts.get_caller_identity())
        roleArn = iam.create_role(
            RoleName='WellPresentedSTS',
            Description='Role for Transcribe usage',
            MaxSessionDuration=36000,
            AssumeRolePolicyDocument=json.dumps(trustPolicy)
        )['Role']['Arn']
        iam.attach_role_policy(
            RoleName='WellPresentedSTS',
            PolicyArn=policyArn
        )
        # wait 10 seconds because the trust policy takes a while to attach
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