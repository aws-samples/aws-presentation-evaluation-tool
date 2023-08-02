// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React, { Component } from "react";
import { Auth } from "aws-amplify";
import "./Home.js";
import "@cloudscape-design/global-styles/index.css";
import Overview from "../charts/overview";
import ValueOverChart from "../charts/valuecharts";
import TrendsStatus from "../charts/trendstatus";
import PaceValues from "../charts/pacingvalues";

import {
  SideNavigation,
  Table,
  AppLayout,
  Header,
  Grid,
} from "@cloudscape-design/components";

//Consts for SideBar Items
export const navItems = [
  {
    type: "section",
    text: "My Presentation",
    defaultExpanded: true,
    onNavigationChange: true,
    items: [
      { type: "link", text: "Metrics Trends", href: "/Metrics" },
      { type: "link", text: "History", href: "/my-presentations" },
      { type: "divider" }
    ],
  },
];

//Cards Functions being called and putting into a grid
function ChartCards(props) {
  return (
    <Grid
      gridDefinition={[
        { colspan: { l: 8, m: 8, default: 7 } },
        { colspan: { l: 4, m: 4, default: 5 } },
        { colspan: { l: 6, m: 6, default: 6 } },
        { colspan: { l: 6, m: 6, default: 6 } },
      ]}
    >
      <Overview />
      <TrendsStatus loadHelpPanelContent={props.loadHelpPanelContent} />
      <ValueOverChart />
      <PaceValues />
    </Grid>
  );
}

//Const/defining and pulling metrics from DB to display
const columnDefinitions = [];

class Content extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currenPageIndex: 0,
    };
  }

  componentDidMount() {
    Auth.currentUserInfo().then((data) => {
      this.setState({ subId: data.attributes.sub });
    });
  }

  render() {
    return (
      //Pagination Item
      <Table
        items={this.props.presentations}
        columnDefinitions={columnDefinitions}
        variant="full-page"
        //Black Box Section
        header={
          <Header variant="awsui-h1-sticky">Metrics Trend Dashboard</Header>
        }
        stickyHeader={true}
        empty={
          <div>
            <ChartCards />
          </div>
        }
      />
    );
  }
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

  render() {
    return (
      //Top Navigation Stuff
      <>
        <AppLayout
          toolsHide
          headerSelector="#header"
          ariaLabels={{ navigationClose: "close" }}
          navigation={<SideNavigation activeHref="/Metrics" items={navItems} />}
          contentType="table"
          content={<Content presentations={this.state.presentations} />}
        />
      </>
    );
  }
}
