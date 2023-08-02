// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React, { Component } from "react";
import {
  Container,
  Header,
  Box,
  Button,
  AreaChart,
} from "@cloudscape-design/components";
import { listPresentations } from "../graphql/queries";
import { API, graphqlOperation, Auth } from "aws-amplify";
import { matchRoutes } from "react-router-dom";

 // --- Component Creations ---
export default class ValueOverChart extends Component {
  constructor(props) {
    super(props);
    this.state = {
      presentations: [],
      fillerWordsData: [],
      weaselWordsData: [],
      biasEmotionSpecificWordsData: [],
    };
  }
  componentDidMount() {
    this.fetchAllPresentations();
    this.fetchCurrentUser();
  }

  // --- Feteching Logged In User ---
  fetchCurrentUser = async () => {
    const user = await Auth.currentAuthenticatedUser();
    this.setState({ currentUser: user.attributes.email.split("@")[0] });
  };

  // --- Feteching User Presentation ---
  fetchAllPresentations = async () => {
    let fillerWordsArray = [];
    let weaselWordsArray = [];
    let biasEmotionSpecificWordsArray = [];
    const presentationData = await API.graphql(
      graphqlOperation(listPresentations)
    );
    const presentationList = presentationData.data.listPresentations.items;
    const filteredPresentationsByOwner = presentationList.filter(
      (presentation) => presentation.owner === this.state.currentUser
    );
    this.setState({ presentations: filteredPresentationsByOwner });

    // --- Beginning of Filler Words ---
    for (let d = 0; d < this.state.presentations.length; d++) {
      fillerWordsArray.push({
        x: new Date(
          new Date(this.state.presentations[d].createdAt).toUTCString()
        ),
        y:
          this.state.presentations[d].PresentationTime <= 60
            ? this.state.presentations[d].FillerWords
            : this.state.presentations[d].PresentationTime > 60
            ? Math.round(
                (this.state.presentations[d].FillerWords /
                  (this.state.presentations[d].PresentationTime / 60)) *
                  10
              ) / 10
            : null,
      });
    }
    fillerWordsArray.sort((a, b) => a.x >= b.x);
    this.setState({ fillerWordsData: fillerWordsArray });
    console.log(this.state.fillerWordsData);

    // --- End of Filler Words ---

    // --- Beginning of Weasel Words ---
    for (let d = 0; d < this.state.presentations.length; d++) {
      weaselWordsArray.push({
        x: new Date(
          new Date(this.state.presentations[d].createdAt).toUTCString()
        ),
        y:
          this.state.presentations[d].PresentationTime <= 60
            ? this.state.presentations[d].WeaselWords
            : this.state.presentations[d].PresentationTime > 60
            ? Math.round(
                (this.state.presentations[d].WeaselWords /
                  (this.state.presentations[d].PresentationTime / 60)) *
                  100
              ) / 100
            : null,
      });
    }
    weaselWordsArray.sort((a, b) => a.x >= b.x);
    this.setState({ weaselWordsData: weaselWordsArray });
    // --- End of Weasel Words ---

    // --- Beginning of Bias Emotion & Specific Words ---
    for (let d = 0; d < this.state.presentations.length; d++) {
      biasEmotionSpecificWordsArray.push({
        x: new Date(
          new Date(this.state.presentations[d].createdAt).toUTCString()
        ),
        y:
          this.state.presentations[d].PresentationTime <= 60
            ? this.state.presentations[d].BiasEmotionSpecificWords
            : this.state.presentations[d].PresentationTime > 60
            ? Math.round(
                (this.state.presentations[d].BiasEmotionSpecificWords /
                  (this.state.presentations[d].PresentationTime / 60)) *
                  10
              ) / 10
            : null,
      });
    }
    biasEmotionSpecificWordsArray.sort((a, b) => a.x >= b.x);
    this.setState({
      biasEmotionSpecificWordsData: biasEmotionSpecificWordsArray,
    });
    // --- End of Bias Emotion & Specific Words ---
  };

  render() {
    const { fillerWordsData, weaselWordsData, biasEmotionSpecificWordsData } =
      this.state;
    return (
      <Container
        className="custom-dashboard-container"
        header={
          <Header variant="h2" description="Trends of various metics">
            Metrics
          </Header>
        }

      // --- Area Chart Cards for Filler Words, Weasel Words & Bias Emotion Specific Words ---
      >
        <AreaChart
          series={[
            {
              title: "Filler Words",
              type: "area",
              data: fillerWordsData,
            },
            {
              title: "Weasel Words",
              type: "area",
              data: weaselWordsData,
            },
            {
              title: "Bias Emotion Specific Words",
              type: "area",
              data: biasEmotionSpecificWordsData,
            },
          ]}
          // --- X Axis/Domain---
          xDomain={
            fillerWordsData && fillerWordsData.length > 1
              ? [
                  fillerWordsData[0].x,
                  fillerWordsData[fillerWordsData.length - 1].x,
                ]
              : [new Date(), new Date()]
          }
           // --- Y Axis/Domain---
          yDomain={[0, 20]}
          i18nStrings={{
            filterLabel: "Filter displayed data",
            filterPlaceholder: "Filter data",
            filterSelectedAriaLabel: "selected",
            detailPopoverDismissAriaLabel: "Dismiss",
            legendAriaLabel: "Legend",
            chartAriaRoleDescription: "line chart",
            detailTotalLabel: "Total",
            xTickFormatter: (e) =>
              e
                .toLocaleString("en-US", {
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
          ariaLabel="Stacked area chart, multiple metrics"
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
