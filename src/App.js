// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import Home from "./pages/Home";
import { Login } from "./pages/Login";
import "semantic-ui-css/semantic.min.css";
import "./styles.css";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { Amplify } from "aws-amplify";
import "@cloudscape-design/global-styles/index.css";
import awsExports from "./aws-exports";
import History from "./pages/History";
import NavBar from "./pages/navbar";
import Metrics from "./pages/Metrics";

Amplify.configure(awsExports);

export default function App() {
  const { user } = useAuthenticator();
  const location = useLocation();

  if (user && user.getSignInUserSession()) {
    return (
      <>
        {location.pathname === "/" ? (
          <NavBar home={true} />
        ) : (
          <NavBar home={false} />
        )}
        <Routes>
          <Route exact path="/" element={<Home />} />
          <Route exact path="/my-presentations" element={<History />} />
          <Route exact path="/metrics" element={<Metrics />} />
        </Routes>
      </>
    );
  }
  return <Login />;
}
