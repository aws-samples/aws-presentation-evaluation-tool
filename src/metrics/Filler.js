// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { fillerCheck ,  } from "../pages/Home";

let count = 0

export function findFiller(str, fillerWords, setFiller) {

  //counter to check if user is doing another dry run session to reset the word counts back to 0
  if (fillerCheck() === 0) {
    count = 0
  }

  //lowercase and remove white space from words
  str = str.toLowerCase()
  str = str.split('.').join("").split(',').join("");
  const substring = str.split(' ');

  //if index in transcript matches the wordbank, increment count and update state
  for (var i = 0; i < substring.length; i++) {

    for (var j = 0; j < fillerWords.length; j++) {
      if (substring[i] == fillerWords[j]) {
        count = count + 1;
        setFiller(count)
      }
    }

  }

}