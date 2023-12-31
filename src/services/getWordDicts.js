// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import axios from 'axios';

let words = {
  "filler": [
      "actually",
      "basically",
      "er",
      "hmm",
      "like",
      "right",
      "uh",
      "um"
  ],
  "specificity": [
      "a bit",
      "a lot",
      "a number of",
      "a while",
      "almost",
      "always",
      "around",
      "awhile",
      "best",
      "better",
      "bigger",
      "complex",
      "considerable",
      "considerably",
      "costly",
      "enough",
      "ever",
      "far",
      "fast",
      "faster",
      "few",
      "fewer",
      "for the most part",
      "frequent",
      "frequently",
      "full",
      "further",
      "greater",
      "higher",
      "in a sense",
      "in a way",
      "lots",
      "lower",
      "many",
      "more",
      "most",
      "mostly",
      "nearly",
      "non-trivial",
      "often",
      "proven",
      "quite",
      "really",
      "roughly",
      "several",
      "significant",
      "significantly",
      "slow",
      "slower",
      "small",
      "smaller",
      "some",
      "somehow",
      "soon",
      "sort of",
      "tiny",
      "trivial",
      "usually",
      "varied",
      "various",
      "vast",
      "very",
      "well",
      "worse",
      "worst"
  ],
  "weasel": [
      "almost",
      "basically",
      "fairly",
      "likely",
      "many",
      "often",
      "probably",
      "quite",
      "rather",
      "reasonably",
      "relatively",
      "somewhat",
      "usually",
      "virtually"
  ],
  "emotion": [
      "anger",
      "angry",
      "anxious",
      "certain",
      "concern",
      "concerned",
      "confidence",
      "confident",
      "depressed",
      "dispair",
      "distress",
      "distressed",
      "doubt",
      "dread",
      "elated",
      "elation",
      "excited",
      "excitement",
      "fear",
      "felt",
      "frustrated",
      "frustration",
      "glad",
      "happy",
      "hope",
      "hoped",
      "joy",
      "mirth",
      "nervous",
      "panic",
      "pleased",
      "relief",
      "relieved",
      "satisfied",
      "scared",
      "shock",
      "sorrow",
      "sure",
      "uncertain",
      "upset",
      "wished",
      "worried",
      "worry"
  ],
  "bias": [
      "black days",
      "black list",
      "blacklist",
      "blacklisted",
      "blacklisting",
      "master",
      "master-slave",
      "removewhitelist",
      "slave",
      "white days",
      "white list",
      "whitelist",
      "whitelisted",
      "whitelisting"
  ]
}

export default function getDicts() {
    return words;
}