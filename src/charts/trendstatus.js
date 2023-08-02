// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0


import React from "react";
import {
  Box,
  HelpPanel,
  Icon,
  Container,
  Header,
  StatusIndicator,
  ColumnLayout,
} from "@cloudscape-design/components";
import { ExternalLinkItem, InfoLink } from "../commons/common-components";

  // --- Helper Function to link to external page to understand what the trends mean ---
function TrendsStatusInfo() {
  return (
    <HelpPanel
      header={<h2>Trends Info - Details</h2>}
      footer={
        <>
          <h3>
            Learn more{" "}
            <span role="img" aria-label="Icon external Link">
              <Icon name="external" />
            </span>
          </h3>
          <ul>
            <li>
              <ExternalLinkItem
                href="#"
                text="Learn more how trends the trends means"
              />
            </li>
          </ul>
        </>
      }
    >
      <p>
        Amazon Web Services publishes our most up-to-the-minute information on
        service availability
      </p>
    </HelpPanel>
  );
}

  // --- Showing the user their Trend ---
export default function TrendsStatus(props) {
  return (
    <></>
  );
}
