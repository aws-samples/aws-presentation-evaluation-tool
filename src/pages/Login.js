// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Auth } from "aws-amplify";
import {
  Authenticator,
  Flex,
  Grid,
  useTheme,
} from "@aws-amplify/ui-react";
//import AWS logo and title to place above sign-in box
import { Header } from "./Header";
import { Button, SpaceBetween } from "@awsui/components-react";
import aws_logo from "../assets/aws_logo.png";

const components = {
  Header,
};

const handleFederatedSignIn = () => {
  Auth.federatedSignIn({ customProvider: "FederateOIDC" });
};

export function Login() {
  const { tokens } = useTheme();

  //use Authenticator Amplify wrapper for user sign-in/sign-up
  return (
    <Grid>
      <Flex
        justifyContent="center"
        position="fixed"
        top="0"
        left="0"
        bottom="0"
        right="0"
        textAlign="center"
        alignItems="center"
      >
        {/* COMMENT WHEN PUSHING TO PROD */}
        <Authenticator components={components}>
          {({ signOut, user }) => (
            <main>
              <h1>Hello {user.username}</h1>
              <button onClick={signOut}>Sign out</button>
            </main>
          )}
        </Authenticator>
      </Flex>
    </Grid>
  );
}
