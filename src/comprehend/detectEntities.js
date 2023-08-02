// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import AWS from 'aws-sdk';

export default async function detectEntities(text, clientCredentials) {
    const comprehend = new AWS.Comprehend(clientCredentials);

    if(text === undefined || text.replace(/\s/g,"") === "") return [];
    const resp = await comprehend.detectEntities({ Text: text, LanguageCode: 'en' }).promise();
    return resp.Entities;
}
