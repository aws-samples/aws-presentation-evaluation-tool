// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0


import { Flex, Image, useTheme } from "@aws-amplify/ui-react";
import logo from '../assets/aws-logo.png';

export function Header() {
  const { tokens } = useTheme();

  return (
    <div>
    <Flex justifyContent="center">
      <Image
        alt="logo"
        src={logo}
        padding={tokens.space.medium}
      />
    </Flex>
    <div style={{color: "white", textAlign: "center", paddingBottom: '1em'}}>
      <h1>Well-Presented Tool</h1>
    </div>
    </div>
  );
}