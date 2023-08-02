// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React, { useEffect, useState } from "react";
import { TopNavigation } from "@awsui/components-react";
import { Auth } from "aws-amplify";
import logo from "../assets/awslogo2.png";

export default function Navbar({ home }) {
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    Auth.currentUserInfo().then((data) => {
      setUserEmail(data.attributes.email);
    });
  }, []);

  async function onSignOutClick() {
    try {
      return(await Auth.signOut());
    } catch (error) {
      console.log("error signing out: ", error);
    }
  }

  return (
    <>
      <div>
        {home ? (
          <TopNavigation
            identity={{
              href: "",
              title: "Well-Presented Tool",
              logo: {
                src: logo,
              },
            }}
            utilities={[
              {
                type: "menu-dropdown",
                text: userEmail,
                description: userEmail,
                iconName: "user-profile",
                items: [
                  {
                    id: "feedback",
                    text: "Feedback",
                    items: [
                      {
                        id: "history",
                        text: "Presentation History",
                        href: "/metrics",
                      },
                    ],
                  }
                ],
              },

              {
                type: "button",
                variant: "primary-button",
                text: "Sign Out",
                onClick: onSignOutClick,
              },
            ]}
            i18nStrings={{
              searchIconAriaLabel: "Search",
              searchDismissIconAriaLabel: "Close search",
              overflowMenuTriggerText: "More",
              overflowMenuTitleText: "All",
              overflowMenuBackIconAriaLabel: "Back",
              overflowMenuDismissIconAriaLabel: "Close menu",
            }}
          />
        ) : (
          <TopNavigation
            identity={{
              href: "/",
              title: "Well-Presented Tool",
              logo: {
                src: logo,
              },
            }}
            utilities={[
              {
                type: "button",
                href: "/",
                iconAlign: "right",
                iconName: "external",
                variant: "normal",
                text: "Start A Presentation",
              },
              {
                type: "button",
                variant: "primary-button",
                text: "Sign Out",
                onClick: onSignOutClick,
              },
            ]}
            i18nStrings={{
              searchIconAriaLabel: "Search",
              searchDismissIconAriaLabel: "Close search",
              overflowMenuTriggerText: "More",
              overflowMenuTitleText: "All",
              overflowMenuBackIconAriaLabel: "Back",
              overflowMenuDismissIconAriaLabel: "Close menu",
            }}
          />
        )}
      </div>
    </>
  );
}
