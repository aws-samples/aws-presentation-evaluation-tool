// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React, { Component } from "react";
import {
  Box,
  Container,
  Header,
  ColumnLayout,
} from "@cloudscape-design/components";
import { CounterLink } from "../commons/common-components";
import { listPresentations } from "../graphql/queries";
import { API, graphqlOperation, Auth } from "aws-amplify";

let currentUser = "";

export default class Overview extends Component {
  constructor(props) {
    super(props);
    this.state = {
      presentations: [],
      totalHoursPresented: 0,
      presentationCount: 0,
    };
  }

  componentDidMount() {
    this.fetchAllPresentations();
    this.fetchCurrentUser();
  }

  // --- Feteching Logged In User ---
  fetchCurrentUser = async () => {
    const user = await Auth.currentAuthenticatedUser();
    currentUser = user.attributes.email.split("@")[0];
  };

    // --- Feteching User Presentations ---
  fetchAllPresentations = async () => {
    const presentationData = await API.graphql(
      graphqlOperation(listPresentations)
    );
    const presentationList = presentationData.data.listPresentations.items;
    const filteredPresentationsByOwner = presentationList.filter(
      (presentation) => presentation.owner === currentUser
    );

    this.setState({ presentations: filteredPresentationsByOwner });
    this.setState({ presentationCount: this.state.presentations.length });

    let time = 0,
      timeInHours = 0;

    for (let h = 0; h < this.state.presentations.length; h++) {
      time = time + this.state.presentations[h].PresentationTime;
      timeInHours = (time / 3600).toFixed(2);
    }
    this.setState({ totalHoursPresented: timeInHours });
  };

  render() {
    return (
    // --- Overview Titling, Description, and Pulling Data ---
      <Container
        className="custom-dashboard-container"
        header={
          <Header variant="h2" description="Viewing data over presentation">
            Presentation Overiew
          </Header>
        }
      >
        <ColumnLayout columns="2" variant="text-grid">
          <div>
            <Box variant="awsui-key-label">Total Presentations</Box>
            <CounterLink>{this.state.presentationCount}</CounterLink>
          </div>
          <div>
            <Box variant="awsui-key-label">Hours Presented</Box>
            <CounterLink>{this.state.totalHoursPresented}</CounterLink>
          </div>
        </ColumnLayout>
      </Container>
    );
  }
}
