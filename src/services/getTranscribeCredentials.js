// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import axios from 'axios';
import { API } from 'aws-amplify';

async function getTranscribeCredentials() {
  const apiName = 'restApi';
  const path = '/transcribe';
  const myInit = {
    headers: {} // OPTIONAL
  };

  return API.get(apiName, path, myInit);
}

export default function getCredentials() {
    return getTranscribeCredentials();
}