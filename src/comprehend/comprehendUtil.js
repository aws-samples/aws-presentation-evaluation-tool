// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import detectEntities from './detectEntities';

export default function runComprehend(text, clientCredentials) {
    return detectEntities(text, clientCredentials)
}