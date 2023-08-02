// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React from "react";
import ReactDOM from "react-dom";
import { AmplifyProvider, Authenticator } from "@aws-amplify/ui-react";
import { StrictMode } from "react";
import { Amplify } from "aws-amplify";
import awsExports from "./aws-exports";
import { BrowserRouter as Router } from "react-router-dom";

import App from "./App";

Amplify.configure(awsExports);

const rootElement = document.getElementById("root");
ReactDOM.render(
  <StrictMode>
    <AmplifyProvider>
      <Authenticator.Provider>
        <Router>
          <App />
        </Router>
      </Authenticator.Provider>
    </AmplifyProvider>
  </StrictMode>,
  rootElement
);
