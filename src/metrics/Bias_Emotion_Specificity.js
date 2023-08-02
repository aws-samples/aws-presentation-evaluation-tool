// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { biasCheck } from "../pages/Home";
let count = 0;

export function findBiasEmotionSpecificity(str, specificityWords, BiasWords, emotionWords, setBiasEmotionSpec) {

  //counter to check if user is doing another dry run session to reset the word counts back to 0
  if (biasCheck() === 0) {
    count = 0
  }

  //lowercase and remove white space from words
  str = str.toLowerCase()
  str = str.split('.').join("").split(',').join("");
  const substring = str.split(' ');

  //if index in transcript matches the wordbanks, increment count and update state
  for (var i = 0; i < substring.length; i++) {

    for (var j = 0; j < specificityWords.length; j++) {
      if (substring[i] == specificityWords[j]) {
        count = count + 1;
        setBiasEmotionSpec(count)
      }
    }

  }
  for (var i = 0; i < substring.length; i++) {

    for (var j = 0; j < BiasWords.length; j++) {
      if (substring[i] == BiasWords[j]) {
        count = count + 1;
        setBiasEmotionSpec(count)
      }
    }

  }
  for (var i = 0; i < substring.length; i++) {

    for (var j = 0; j < emotionWords.length; j++) {
      if (substring[i] == emotionWords[j]) {
        count = count + 1;
        setBiasEmotionSpec(count)
      }
    }

  }

}