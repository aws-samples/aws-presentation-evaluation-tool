// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0


import React, { Component, useEffect, useState } from "react";
import { listPresentations } from "../graphql/queries";
import { API, graphqlOperation, Auth } from "aws-amplify";
import "./Home.js";
import logo from "../assets/awslogo2.png";
import "@cloudscape-design/global-styles/index.css";
import Metrics from "./Metrics";

import {
  TopNavigation,
  SideNavigation,
  Button,
  BreadcrumbGroup,
  Table,
  Input,
  AppLayout,
  Header,
  Container as PolContainer,
  ColumnLayout,
  Popover,
  Box,
  StatusIndicator,
  SpaceBetween,
  Select,
  Modal,
  Flashbar,
  Icon,
  Alert,
  Cards,
  Pagination,
  CollectionPreferences,
} from "@cloudscape-design/components";

let userEmail = null;

//Consts for SideBar Items
export const navItems = [
  {
    type: "section",
    text: "My Presentation",
    defaultExpanded: true,
    onNavigationChange: true,
    items: [
      { type: "link", text: "Metrics Trends", href: "/metrics" },
      { type: "link", text: "History", href: "/my-presentations" },
      { type: "divider" }
    ],
  },
];

//Const/defining and pulling metrics from DB to display
const columnDefinitions = [
  {
    id: "PresentationTime",
    cell: (item) =>
      item.PresentationTime < 60
        ? `${item.PresentationTime} sec presentation on ${new Date(
            item.createdAt.split("T")[0]
          ).toDateString()}`
        : item.PresentationTime >= 60
        ? `${
            (item.PresentationTime / 60).toString().split(".")[0]
          } min  ${Math.ceil(
            (item.PresentationTime * ((item.PresentationTime / 60) % 1.0)) /
              (item.PresentationTime / 60)
          )} sec presentation on ${new Date(
            item.createdAt.split("T")[0]
          ).toDateString()}`
        : null,
    header: "Presentation",
    minWidth: 100,
  },
  {
    id: "FilleWords",
    header: "Filler Words",
    cell: (item) => item.FillerWords,
    minWidth: 100,
  },
  {
    id: "WeaselWords",
    header: "Weasel Words",
    cell: (item) => item.WeaselWords,
    minWidth: 100,
  },
  {
    id: "BiasEmotionSpecificWords",
    header: "Bias, Emotion & Specific Words",
    cell: (item) => item.BiasEmotionSpecificWords,
    minWidth: 100,
  },
  {
    id: "EyeContact",
    header: "Eye Contact",
    cell: (item) => item.EyeContact,
    minWidth: 100,
  },
  {
    id: "SpeakingPacePerMin",
    header: "Speaking Pace Per Min",
    cell: (item) => item.SpeakingPacePerMin,
    minWidth: 100,
  },
];

function Content(props) {
  const [subId, setSubId] = useState("");
  const [currenPageIndex, setCurrentPageIndex] = useState(1);

  useEffect(() => {
    Auth.currentUserInfo().then((data) => {
      setSubId(data.attributes.sub);
      userEmail = data.attributes.email;
    });
  }, []);

  return (
    //Pagination Item
    <Table
      items={props.presentations}
      columnDefinitions={columnDefinitions}
      variant="full-page"
      pagination={
        <Pagination
          ariaLabels={{
            nextPageLabel: "Next page",
            previousPageLabel: "Previous page",
            pageLabel: (pageNumber) => `Page ${pageNumber} of all pages`,
          }}
          currentPageIndex={currenPageIndex}
          onChange={({ detail }) =>
            setCurrentPageIndex(detail.currentPageIndex)
          }
          pagesCount={5}
        />
      }
      //Black Box Section
      header={
        <Header
          variant="awsui-h1-sticky"
          counter={`(${props.presentations.length})`}
        >
          My Presentations
        </Header>
      }
      stickyHeader={true}
      empty={
        <Box margin={{ vertical: "xs" }} textAlign="center" color="inherit">
          <SpaceBetween size="xxs">
            <div>
              <b>No Presentations</b>
              <Box variant="p" color="inherit">
                You don't have any presentations.
              </Box>
            </div>
          </SpaceBetween>
        </Box>
      }
    />
  );
}

export default class History extends Component {
  constructor(props) {
    super(props);
    this.state = {
      searchValue: "",
      presentations: [],
      currentUser: "",
    };
  }

  componentDidMount = async () => {
    this.fetchAllPresentations();
    this.fetchCurrentUser();
  };

  fetchCurrentUser = async () => {
    const user = await Auth.currentAuthenticatedUser();
    this.setState({ currentUser: user.attributes.email.split("@")[0] });

  };

  fetchAllPresentations = async () => {
    const presentationData = await API.graphql(
      graphqlOperation(listPresentations)
    );

    const presentationList = presentationData.data.listPresentations.items;
    const filteredPresentationsByOwner = presentationList.filter(
      (presentation) => presentation.owner == this.state.currentUser
    );

    this.setState({ presentations: filteredPresentationsByOwner });
  };

  render() {
    return (
      //Top Navigation Stuff
      <>
        <AppLayout
          toolsHide
          headerSelector="#header"
          ariaLabels={{ navigationClose: "close" }}
          navigation={
            <SideNavigation activeHref="/my-presentations" items={navItems} /> // this has been updated!!!!
          }
          contentType="table"
          content={<Content presentations={this.state.presentations} />}
        />
      </>
    );
  }
}
