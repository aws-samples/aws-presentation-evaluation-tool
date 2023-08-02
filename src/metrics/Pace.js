// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import time from '../pages/Home'
import { modTime } from '../pages/Home';
import { avgPaceCheck, paceCheck } from "../pages/Home";

let y = 0
let x = 0
let timeStamp = 0
let counter = 0;
let min = 1;

export function countWords(setWordCount, str, time, setMinute, setAvg) {

    //counter to check if user is doing another dry run session to reset the word counts back to 0
    if (avgPaceCheck() === 0) {
        x = 0
        timeStamp = 0;
    }

    //parse and find period, store time stamp of the period
    const arr = str.split(' ');
    x = x + arr.filter(word => word !== '').length;
    setAvg(x)

    //set current minute for computation
    time = Math.floor(time)


    //if user is speaking and the time goes over 60 seconds, count number of words spoken over the 60 second interval mark to count towards past 60 seconds
    if (time - timeStamp < 61) {

        const arr = str.split(' ');
        y = y + arr.filter(word => word !== '').length;

    }

    //else, update states and time
    else {
        setWordCount(y)
        y = 0

        setMinute(timeStamp)
        timeStamp = time


    }
}

