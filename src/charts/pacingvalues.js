// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0


import React, { Component } from "react";
import { Container, Header, Box, Button } from "@cloudscape-design/components";
import { LineChart } from "@awsui/components-react";
import { listPresentations } from "../graphql/queries";
import { API, graphqlOperation, Auth } from "aws-amplify";

export default class PaceValues extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentUser: "",
      presentations: [],
      timePresentedData: [],
      speakingPacePerMinData: [],
    };
  }

  componentDidMount() {
    this.fetchAllPresentations();
    this.fetchCurrentUser();
  }
  fetchCurrentUser = async () => {
    const user = await Auth.currentAuthenticatedUser();
    this.setState({ currentUser: user.attributes.email.split("@")[0] });
  };

  fetchAllPresentations = async () => {
    let timePresentedArray = [];
    let speakingPacePerMinArray = [];
    //let biasEmotionSpecificWordsArray = [];
    const presentationData = await API.graphql(
      graphqlOperation(listPresentations)
    );
    const presentationList = presentationData.data.listPresentations.items;
    const filteredPresentationsByOwner = presentationList.filter(
      (presentation) => presentation.owner === this.state.currentUser
    );
    this.setState({ presentations: filteredPresentationsByOwner });

    // --- Beginning of Time Presented ---
    for (let d = 0; d < this.state.presentations.length; d++) {
      timePresentedArray.push({
        x: new Date(
          new Date(this.state.presentations[d].createdAt).toUTCString()
        ),
        y: (this.state.presentations[d].PresentationTime / 60).toFixed(2),
      });
    }
    timePresentedArray.sort((a, b) => a.x >= b.x);
    this.setState({ timePresentedData: timePresentedArray });

    // --- End of Time Presented ---

    // // --- Beginning of Speaking Pace per Minute---
    for (let d = 0; d < this.state.presentations.length; d++) {
      speakingPacePerMinArray.push({
        x: new Date(
          new Date(this.state.presentations[d].createdAt).toUTCString()
        ),
        y:
          this.state.presentations[d].SpeakingPacePerMin === "- WPM"
            ? 0
            : parseInt(this.state.presentations[d].SpeakingPacePerMin.split("-")[0]),
      });
    }
    speakingPacePerMinArray.sort((a, b) => a.x >= b.x);
    this.setState({ speakingPacePerMinData: speakingPacePerMinArray });
    // // --- End of Speaking Pace per Minute ---


    // // --- Beginning of Performance Goal ---

    // --- End of Bias Emotion & Specific Words ---
  };

  render() {
    const { timePresentedData, speakingPacePerMinData } = this.state;
    return (
      <Container
        className="custom-dashboard-container"
        header={
          <Header
            variant="h2"
            description="Speaking pace compared to time presented"
          >
            Speaking Pace
          </Header>
        }
     // --- Line Charts Cards for Speaking Pace Line & Time Presented ---
      >
        <LineChart
          series={[
            {
              title: "Time Presented",
              type: "line",
              data: timePresentedData,
            },
            {
              title: "Speaking Pace",
              type: "line",
              data: speakingPacePerMinData,
            }
          ]}
           // --- X Axis/Domain---
          xDomain={
            timePresentedData && timePresentedData.length > 1
              ? [
                  timePresentedData[0].x,
                  timePresentedData[timePresentedData.length - 1].x,
                ]
              : [new Date(), new Date()]
          }
          // --- Y Axis/Domain for Speaking Pace ---
          yDomain={[0, 400]}
          i18nStrings={{
            filterLabel: "Filter displayed data",
            filterPlaceholder: "Filter data",
            filterSelectedAriaLabel: "selected",
            detailPopoverDismissAriaLabel: "Dismiss",
            legendAriaLabel: "Legend",
            chartAriaRoleDescription: "line chart",
            xTickFormatter: (e) =>
              e
                .toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "numeric",
                  hour12: 1,
                })
                .split(",")
                .join("\n"),
            
            yTickFormatter: function o(e) {
              return e.toFixed(0);
            },
          }}
          // --- Titling & Others on the Card ---
          ariaLabel="Multiple data series line chart"
          errorText="Error loading data."
          height={300}
          loadingText="Loading chart"
          recoveryText="Retry"
          xScaleType="time"
          xTitle="Time (UTC)"
          yTitle="Words per Minute"
          empty={
            <Box textAlign="center" color="inherit">
              <b>No data available</b>
              <Box variant="p" color="inherit">
                There is no data available
              </Box>
            </Box>
          }
          noMatch={
            <Box textAlign="center" color="inherit">
              <b>No matching data</b>
              <Box variant="p" color="inherit">
                There is no matching data to display
              </Box>
              <Button>Clear filter</Button>
            </Box>
          }
        />
      </Container>
    );
  }
}
