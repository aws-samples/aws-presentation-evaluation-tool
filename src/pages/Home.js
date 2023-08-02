// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React, { Component } from "react";
import { renderToString } from "react-dom/server";
import { Auth } from "aws-amplify";
import { Container, Form } from "semantic-ui-react";
import ContentEditable from "react-contenteditable";
import "./Home.css";
import Webcam from "react-webcam";
import { createPresentation } from "../graphql/mutations";
import { API, graphqlOperation } from "aws-amplify";
import { startAudio, stopAudio } from "../audio/miceAudioStream";
import getCredentials from "../services/getTranscribeCredentials";
import getDicts from "../services/getWordDicts";
import runComprehend from "../comprehend/comprehendUtil";
import { TranscriptLine } from "../comprehend/TranscriptLine";
import {
  Button,
  Header,
  Container as PolContainer,
  ColumnLayout,
  Popover,
  Box,
  StatusIndicator,
  SpaceBetween,
  Link,
  Select,
  Modal,
  Flashbar,
  Icon,
  Alert,
} from "@awsui/components-react";

//WebGazer save local data from model across user sessions to enable better calibration

window.saveDataAcrossSessions = true;

//constants used for XY coordinate range to detect eye contact
const UPPER_CUTOFF = window.innerHeight / 8;
const LEFT_CUTOFF = window.innerWidth / 4;
const RIGHT_CUTOFF = window.innerWidth / 4;

//all variables used to store time, calculations, flags to start/stop, etc.
var time = 0;
let timer = null;
let startLookTime = 0;
let eyeDetection = 0;
let y = 0;
let x = 0;
let interval = null;
let presentationStart = false;
let countdown = 0;
let startup = 0;
var language = null;
let webgazer = null;
let presentationCount = 0;
let userEmail = null;
var countPace = 0;
var countAvgPace = 0;
let avgPaceSet = 0;
let paceSet = 0;
var countFillerWords = 0;
var countWeaselWords = 0;
var countBiasWords = 0;
let eyeAlert = false;
let avgAlert = false;
let paceAlert = false;
let engagementAlert = false;
let fillerAlert = false;
let weaselAlert = false;
let biasAlert = false;

function App() {
  //All functions needed for metric calculations
  return <HomeScreen />;
}

//returns current time
export function getTime() {
  return time;
}

//NOT USED ANYMORE --> this function used to test Pace to see if it outputs results every 50 seconds
export function modTime() {
  time = Math.floor(time / 1000);
  return time % 50;
}

//all CHECK metrics used to check if user is doing another dry run session --> will be used to reset all metrics/local variables used in other metric calculation files
export function paceCheck() {
  return countPace;
}

export function avgPaceCheck() {
  return countAvgPace;
}

export function fillerCheck() {
  return countFillerWords;
}

export function weaselCheck() {
  return countWeaselWords;
}

export function biasCheck() {
  return countBiasWords;
}

export function getLanguage() {
  return language;
}

export default App;

class HomeScreen extends Component {
  //all initial state values used when user first logins to page
  constructor(props) {
    super(props);
    this.state = {
      presentationTime: 0,
      displayTime: "00:00:00",
      listening: false,
      start: false,
      transcriptPiece: "",
      clientCredentials: {},
      transcriptionHtml: "",
      eyeMetric: (
        <StatusIndicator type="loading">Pending input</StatusIndicator>
      ),
      colorEye: null,
      colorPace: null,
      colorAvgPace: null,
      colorQ: null,
      colorFiller: null,
      colorWeasel: null,
      colorBias: null,
      stamp: "-",
      diff: 0,
      diffDisplay: (
        <StatusIndicator type="loading">Pending input</StatusIndicator>
      ),
      words: <StatusIndicator type="loading">Pending input</StatusIndicator>,
      mins: "-",
      avgPace: <StatusIndicator type="loading">Pending input</StatusIndicator>,
      filler: <StatusIndicator type="loading">Pending input</StatusIndicator>,
      weasel: <StatusIndicator type="loading">Pending input</StatusIndicator>,
      g1: <StatusIndicator type="loading">Pending input</StatusIndicator>,
      selectedOption: { label: "English", value: "1" },
      visible: "true",
      isModal: true,
      isModalVisible: false,
      isCalibrated: false,
      isClickable: false,
      clicks: 1,
      isAlert: false,
      subId: "",
      isPresentationView: false,
    };
  }

  //mount user email from authentication

  componentDidMount() {
    Auth.currentUserInfo().then((data) => {
      this.setState({ subId: data.attributes.sub });
      userEmail = data.attributes.email;
    });
  }

  //when presentation starts, get pre-signed credentials before calling on state functions to compute word count, time, etc.
  startRecording = () => {
    getCredentials()
      .then((result) => {
        startAudio(
          this.toggleStartStop,
          this.getTranscript,
          result,
          getDicts(),
          this.setTimeStamp,
          this.setWordCount,
          this.setMinute,
          this.setAvg,
          this.setFiller,
          this.setWeasel,
          this.setBiasEmotionSpec
        );

        this.setState({ clientCredentials: result });

        // this.setState({ clientCredentials: result });
      })

      .catch((err) => {
        console.log(err);

        // toggleStartStop();
      });
  };

  //this function was initially used for Engagement metric --> NOT NEEDED ANYMORE
  setTimeStamp = (timeStamp) => {
    this.setState({ stamp: timeStamp.toFixed(2) + "s" });
  };

  //this function is being used for word count for pace per minute
  setWordCount = (count) => {
    paceCheck();
    countPace++;
    paceSet = count;
    //increment state value with current count
    this.setState({ words: paceSet + " WPM" });

    //update color of metric depending on current pace WPM

    //set alert to true to display central alert if threshold broken

    if (paceSet < 125) {
      this.setState({ colorPace: "rgb(" + 209 + "," + 50 + "," + 18 + ")" });

      paceAlert = true;
    } else if (paceSet > 150) {
      this.setState({ colorPace: "rgb(" + 209 + "," + 50 + "," + 18 + ")" });

      paceAlert = true;
    } else {
      this.setState({ colorPace: "rgb(" + 29 + "," + 129 + "," + 2 + ")" });

      paceAlert = false;
    }
  };

  //NOT NEEDED --> USED FOR TESTING PURPOSES

  setMinute = (seconds) => {
    this.setState({ mins: seconds });
  };

  //this function is being used for average pace WPM

  setAvg = (countAvg) => {
    avgPaceCheck();
    countAvgPace++;

    //take the total word count divided by presentation time * 60 seconds to get the real-time pace as the presentation goes on
    if (this.state.presentationTime != 0) {
      avgPaceSet = Math.floor((countAvg / this.state.presentationTime) * 60);
      this.setState({ avgPace: avgPaceSet + " WPM" });
    } else {
      avgPaceSet = 0;
    }

    //increment state value with current average pace

    //update color of metric depending on current pace WPM

    //set alert to true to display central alert if threshold broken

    if (avgPaceSet < 125) {
      if (this.state.avgPace == "- WPM") {
        this.setState({ colorAvgPace: null });
      } else {
        this.setState({
          colorAvgPace: "rgb(" + 209 + "," + 50 + "," + 18 + ")",
        });

        avgAlert = true;
      }
    } else if (avgPaceSet > 150) {
      this.setState({ colorAvgPace: "rgb(" + 209 + "," + 50 + "," + 18 + ")" });

      avgAlert = true;
    } else {
      this.setState({ colorAvgPace: "rgb(" + 29 + "," + 129 + "," + 2 + ")" });

      avgAlert = false;
    }
  };

  //this function is being used to count total filler words

  setFiller = (count) => {
    fillerCheck();
    countFillerWords++;

    //increment state value with current count
    this.setState({ filler: count });

    //update color of metric depending on number of filler words

    //set alert to true to display central alert if threshold broken

    if (this.state.filler < 10) {
      this.setState({ colorFiller: "rgb(" + 29 + "," + 129 + "," + 2 + ")" });

      fillerAlert = false;
    } else if (this.state.filler <= 20 && this.state.filler >= 10) {
      this.setState({ colorFiller: "rgb(" + 255 + "," + 153 + "," + 0 + ")" });

      fillerAlert = false;
    } else if (this.state.filler > 20) {
      this.setState({ colorFiller: "rgb(" + 209 + "," + 50 + "," + 18 + ")" });

      fillerAlert = true;
    }
  };

  //this function is being used to count total weasel words

  setWeasel = (count) => {
    weaselCheck();
    countWeaselWords++;

    //increment state value with current count
    this.setState({ weasel: count });

    //update color of metric depending on number of weasel words

    //set alert to true to display central alert if threshold broken

    if (this.state.weasel < 10) {
      this.setState({ colorWeasel: "rgb(" + 29 + "," + 129 + "," + 2 + ")" });

      weaselAlert = false;
    } else if (this.state.weasel <= 20 && this.state.weasel >= 10) {
      this.setState({ colorWeasel: "rgb(" + 255 + "," + 153 + "," + 0 + ")" });
      weaselAlert = false;
    } else if (this.state.weasel > 20) {
      this.setState({ colorWeasel: "rgb(" + 209 + "," + 50 + "," + 18 + ")" });
      weaselAlert = true;
    }
  };

  //this function is being used to count total bias, emotion and specificity words

  setBiasEmotionSpec = (count) => {
    biasCheck();
    countBiasWords++;

    //increment state value with current count
    this.setState({ g1: count });

    //update color of metric depending on number of bias, emotion and specificity words

    //set alert to true to display central alert if threshold broken

    if (this.state.g1 < 10) {
      this.setState({ colorBias: "rgb(" + 29 + "," + 129 + "," + 2 + ")" });

      biasAlert = false;
    } else if (this.state.g1 <= 20 && this.state.g1 >= 10) {
      this.setState({ colorBias: "rgb(" + 255 + "," + 153 + "," + 0 + ")" });

      biasAlert = false;
    } else if (this.state.g1 > 20) {
      this.setState({ colorBias: "rgb(" + 209 + "," + 50 + "," + 18 + ")" });

      biasAlert = true;
    }
  };

  //gets current transcript line by line as transcribe returns results

  //uses current comprehend model for entities --> NOT NEEDED UNTIL MODEL IS MADE TO DETECT FILLER, WEASEL, ETC.

  //once pause detected, create new line break in box

  getTranscript = (transcript, isFinal) => {
    if (isFinal) {
      runComprehend(transcript, this.state.clientCredentials).then(
        (entities) => {
          let htmltxt = renderToString(
            <TranscriptLine chunk={transcript} results={entities} />
          );

          this.setState({
            transcriptionHtml: this.state.transcriptionHtml + htmltxt,

            transcriptPiece: "",
          });
        }
      );
    } else {
      this.setState({ transcriptPiece: transcript + "\n" });
    }
    this.scrollToBottom();
  };

  //stop microphone recording
  endRecording = () => {
    stopAudio();
  };

  //NOT NEEDED --> USED INITIALLY FOR STOPPING AND STARTING PRESENTATION
  toggleStartStop = () => {
    this.setState({ listening: !this.state.listening });
  };

  //autoscroll the transcript box to bottom
  scrollToBottom = () => {
    if (this.textarearef) {
      this.textarearef.scrollIntoView({ behavior: "smooth" });
    }
  };

  //convert the state presentation time (in seconds) to presentation display format (00:00:00)
  secondsToHms(d) {
    d = Number(d);
    var h = Math.floor(d / 3600);
    var m = Math.floor((d - h * 3600) / 60);
    var s = Math.floor(d - h * 3600 - m * 60);
    if (h < 10) {
      h = "0" + h;
    }
    if (m < 10) {
      m = "0" + m;
    }
    if (s < 10) {
      s = "0" + s;
    }

    //update displayTime metric with new format
    this.setState({ displayTime: h + ":" + m + ":" + s });
  }

  //convert the state difference timer (for the engagement metric) to display format (00:00:00)
  timeToLastQConvert(d) {
    d = Number(d);
    var h = Math.floor(d / 3600);
    var m = Math.floor((d % 3600) / 60);
    var s = Math.floor((d % 3600) % 60);
    var mDisplay = m > 9 ? m : "0" + m + ":";
    var sDisplay = s > 9 ? s : "0" + s;
    this.setState({ diffDisplay: mDisplay + sDisplay + "s ago" });
  }

  //this function is being used as central timer for presentation time --> presentation time then used for engagement metric

  timerConvert = () => {
    interval = setInterval(() => {
      y = y + 1;
      x = x + 1;
      //use interval timer to increment presentation time
      this.setState({ presentationTime: y });
      //convert time to display format
      this.secondsToHms(this.state.presentationTime);
      //update difference state variable with other count for engagement metric
      this.setState({ diff: x });

      //convert difference state variable to display format
      this.timeToLastQConvert(this.state.diff);

      //if question mark detected in transcript, reset engagement metric back to 0
      for (var i = 0; i < this.state.transcriptPiece.length; i++) {
        var z = this.state.transcriptPiece.charAt(i);
        if (z == "?") {
          x = 0;
        }
      }

      //update color of engagement metric depending on difference timer

      //set alert to true to display central alert if threshold broken

      if (this.state.diff <= 60) {
        this.setState({ colorQ: "rgb(" + 29 + "," + 129 + "," + 2 + ")" });
        engagementAlert = false;
      } else if (this.state.diff > 60 && this.state.diff <= 120) {
        this.setState({ colorQ: "rgb(" + 255 + "," + 153 + "," + 0 + ")" });
        engagementAlert = false;
      } else if (this.state.diff > 120) {
        this.setState({ colorQ: "rgb(" + 209 + "," + 50 + "," + 18 + ")" });
        engagementAlert = true;
      }
    }, 1000);
  };

  //end interval once presentation ends

  endTimer = () => {
    clearInterval(interval);
  };

  /* HERE WE WILL SEND THE STATE RESULTS TO DYNAMO --> CALL THIS FUNCTION IN ONENDPRESENTATION*/

  dynamoDBHistory = async () => {
    let owner = userEmail.split("@")[0];
    let input = {
      EyeContact: this.state.eyeMetric,
      SpeakingPaceRealTime: this.state.avgPace,
      SpeakingPacePerMin: this.state.words,
      Engagement: this.state.displayTime,
      FillerWords: this.state.filler,
      WeaselWords: this.state.weasel,
      BiasEmotionSpecificWords: this.state.g1,
      owner: owner,
      PresentationTime: this.state.presentationTime.toLocaleString(),
      sub: this.state.subId,
    };


    try {
      await API.graphql(graphqlOperation(createPresentation, { input }));
    } catch (err) {
      console.log(err);
    }
  };

  //when user clicks Start Presentation button

  onStartPresentation = (event) => {
    //increment number of presentations by 1 --> this is used in Check functions to reset metrics
    this.setState({ isPresentationView: true });
    presentationCount = presentationCount + 1;
    if (presentationCount > 1) {
      this.startCamera();
    }

    //set state variables with initial display values
    presentationStart = true;
    language = this.state.selectedOption.label;
    this.setState({
      diffDisplay: "00:00:00",
      displayTime: "00:00:00",
      words: "- WPM",
      mins: "-",
      avgPace: "- WPM",
      filler: 0,
      weasel: 0,
      g1: 0,
      colorFiller: "rgb(" + 29 + "," + 129 + "," + 2 + ")",
      colorWeasel: "rgb(" + 29 + "," + 129 + "," + 2 + ")",
      colorBias: "rgb(" + 29 + "," + 129 + "," + 2 + ")",
      colorEye: null,
      colorPace: null,
      colorAvgPace: null,
      colorQ: null,
      transcriptPiece: "",
      transcriptionHtml: "",
    });

    //remove model loaded alert and begin timer and recording audio

    this.setState({ isLoaded: false });
    this.setState({ isLanguageSelected: true });
    this.timerConvert();
    this.startRecording();
  };

  //when presentation ends, reset all variables, end audio and camera for eye detection

  onEndPresentation = () => {
    //this.setState({ isModalVisible: true });
    this.setState({
      isPresentationView: false,
    });
    this.dynamoDBHistory();
    presentationStart = false;
    countPace = 0;
    countAvgPace = 0;
    countFillerWords = 0;
    countWeaselWords = 0;
    countBiasWords = 0;
    this.endCamera();
    this.endTimer();
    this.endRecording();
    time = 0;
    startLookTime = 0;
    eyeDetection = 0;
    y = 0;
    x = 0;
    countdown = 0;
    startup = 0;
    eyeAlert = false;
    avgAlert = false;
    paceAlert = false;
    engagementAlert = false;
    fillerAlert = false;
    weaselAlert = false;
    biasAlert = false;
    this.setState({
      presentationTime: 0,
      start: false,
      stamp: "-",
      diff: 0,
      isLanguageSelected: false,
      visible: true,
      isModal: false,
      isAlert: false,
      colorAvgPace: null,
      avgPace: "- WPM",
    });
  };

  //WebGazer initialization

  startCamera = () => {
    window.navigator.mediaDevices.getUserMedia({
      video: false,
      audio: true,
    });
    webgazer = window.webgazer;
    this.setState({ visible: false });
    //check if model is already loaded in --> if no (a.k.a its the first dry run, show alert)
    if (presentationCount <= 1) {
      this.setState({ isLoading: true });
    } else {
      this.setState({ isLoading: false });
    }

    //make green loaded alert and red square calibration appear once the model is loaded in and 6 seconds have passed (buffer time)
    countdown = setInterval(() => {
      startup = startup + 1;
      if (startup === 6 && presentationCount <= 1) {
        this.setState({ isLoading: false });
        this.setState({ isLoaded: true });
        this.setState({ isClickable: true });
        clearInterval(countdown);
      } else if (startup === 6 && presentationCount > 1) {
        this.setState({ isLoading: false });
        this.setState({ isLoaded: false });
        clearInterval(countdown);
      }
    }, 1000);

    //start WebGazer client
    webgazer
      .setGazeListener((data, timestamp) => {
        time = timestamp;
        if (data == null) return;
        if (presentationStart === true) {
          //if X and Y coordinates in webcam range, increment counter to count time user is looking
          if (
            data.y <= UPPER_CUTOFF &&
            data.x >= LEFT_CUTOFF &&
            data.y <= RIGHT_CUTOFF
          ) {
            clearInterval(timer);
            timer = setInterval(() => {
              startLookTime = startLookTime + 1;
            }, 1000);
          }

          if (this.state.presentationTime === 0) {
            eyeDetection = 0;
            startLookTime = 0;
          }

          //take time user has looked at camera divided by total presentation time to update eye contact metric
          if (this.state.presentationTime >= 1) {
            eyeDetection = (
              (1 - startLookTime / this.state.presentationTime) *
              100
            ).toFixed(2);

            //update color of metric depending on eye detection thresholds
            //set alert to true to display central alert if threshold broken
            if (eyeDetection >= 60) {
              this.setState({
                colorEye: "rgb(" + 29 + "," + 129 + "," + 2 + ")",
              });
              eyeAlert = false;
            } else if (eyeDetection >= 40 && eyeDetection <= 60) {
              this.setState({
                colorEye: "rgb(" + 255 + "," + 153 + "," + 0 + ")",
              });
              eyeAlert = false;
            } else {
              this.setState({
                colorEye: "rgb(" + 209 + "," + 50 + "," + 18 + ")",
              });
              eyeAlert = true;
            }
            this.setState({ eyeMetric: eyeDetection + "%" });
          }
        }

        //CENTRAL ALERT --> IF ANY METRIC THRESHOLD IS BREACHED, SET ALERT TO TRUE
        if (
          eyeAlert === true ||
          avgAlert === true ||
          paceAlert === true ||
          engagementAlert === true ||
          fillerAlert === true ||
          weaselAlert === true ||
          biasAlert === true
        ) {
          this.setState({ isAlert: true });
        } else {
          this.setState({ isAlert: false });
        }
      })
      .begin();

    //remove default webgazer settings (ex. webcam box, overlay of face, red dot to track eyes, etc.)
    webgazer.showPredictionPoints(false);
    webgazer.showFaceOverlay(false);
    webgazer.showVideo(false);
    webgazer.showFaceFeedbackBox(false);
  };

  //end webgazer client
  endCamera = () => {
    webgazer.end();
  };

  //counts number of times user clicks the red box during calibration, will disappear once 10 has been reached --> update states once 10 has been reached
  incrementClick = () => {
    this.setState({ clicks: this.state.clicks + 1 });
    if (this.state.clicks === 10) {
      this.setState({ isClickable: false });
      this.setState({ isCalibrated: true });
      this.setState({ isLoaded: false });
    }
  };

  //ALL POLARIS AND UI ELEMENTS HERE
  render() {
    const {
      displayTime,
      listening,
      transcriptPiece,
      start,
      textchunks,
      comprehendResults,
      line,
      transcriptionHtml,
      eyeMetric,
      colorEye,
      colorPace,
      colorAvgPace,
      colorQ,
      colorFiller,
      colorWeasel,
      colorBias,
      stamp,
      words,
      diffDisplay,
      avgPace,
      weasel,
      g1,
      filler,
      selectedOption,
    } = this.state;

    //size of webcam box

    const videoConstraints = {
      width: 650,
      height: 350,
      facingMode: "user",
    };

    const isLoading = this.state.isLoading;
    const isLoaded = this.state.isLoaded;
    let loading;
    let loaded;
    const isLanguageSelected = this.state.isLanguageSelected;
    let languageSelected;
    const isModal = this.state.isModal;
    let modal;
    const isCalibrated = this.state.isCalibrated;
    let calibrated;
    const isClickable = this.state.isClickable;
    let clickable;

    //Polaris flashbar --> used to show loading eye detection model if state is true

    if (isLoading === true) {
      loading = (
        <Flashbar
          items={[
            {
              type: "success",
              loading: true,
              content: "Starting eye detection model.",
              id: "message_1",
            },
          ]}
        />
      );
    }

    //once eye detection model is loaded, display new success flashbar

    if (isLoaded === true) {
      loaded = (
        <Flashbar
          items={[
            {
              type: "success",
              content: `Eye detection model loaded. Please click on the blue button below the webcam ${
                11 - this.state.clicks
              } times. You may start your presentation once finished.`,
              id: "message_2",
            },
          ]}
        />
      );
    }

    //if presentation has begun, DISABLE the ability to click dropdown language support

    if (isLanguageSelected === true) {
      languageSelected = (
        <Select
          selectedOption={selectedOption}
          onChange={({ detail }) =>
            this.setState({ selectedOption: detail.selectedOption })
          }
          options={[
            { label: "English", value: "1" },
            { label: "French", value: "2" },
            { label: "French-Canadian", value: "3" },
            { label: "Spanish", value: "4" },
            { label: "Portugese", value: "5" },
            { label: "Japanese", value: "6" },
            { label: "Italian", value: "7" },
            { label: "German", value: "8" },
            { label: "Chinese-Mandarin", value: "9" },
          ]}
          disabled
          selectedAriaLabel="Selected"
        />
      );
    }

    //else, give user ability to select language and pass encoding of language to MiceAudioStream
    else {
      languageSelected = (
        <Select
          selectedOption={selectedOption}
          onChange={({ detail }) =>
            this.setState({ selectedOption: detail.selectedOption })
          }
          options={[
            { label: "English", value: "1" },
            { label: "French", value: "2" },
            { label: "French-Canadian", value: "3" },
            { label: "Spanish", value: "4" },
            { label: "Portugese", value: "5" },
            { label: "Japanese", value: "6" },
            { label: "Italian", value: "7" },
            { label: "German", value: "8" },
            { label: "Chinese-Mandarin", value: "9" },
          ]}
          selectedAriaLabel="Selected"
        />
      );
    }

    //welcome model that is loaded in on initial sign-in

    if (isModal === true) {
      modal = (
        <Modal
          onDismiss={() => {
            this.setState({ visible: false });

            this.startCamera();
          }}
          visible={this.state.visible}
          closeAriaLabel="Close modal"
          size="large"
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="primary" onClick={this.startCamera}>
                  Begin Calibration
                </Button>
              </SpaceBetween>
            </Box>
          }
          header="AWS Well-Presented Tool"
        >
          <h3>Getting Started</h3>
          <h4>Calibration</h4>
          <p>
            Welcome to the AWS Well-Presented Tool. To calibrate the eye
            detection model, please click the "Begin Calibration" button, wait
            until the model has been loaded, then proceed to click the blue
            button below the webcam 10 times. Once finished, click "Start
            Presentation" to begin.
          </p>
          <h4>Metrics</h4>
          <p>
            For Eye Contact, after calibrating the model, begin your
            presentation by looking at the camera. The metric will start at 100%
            to accomodate for this. For Speaking Pace (Per Min.), the metric
            will update roughly every 1 minute and 20 seconds to accomodate
            delays and Amazon Transcribe feedback.
          </p>
          <h4>Camera Setup</h4>
          <p>
            For the most accurate eye detection results, try to keep your head
            still and avoid moving around. Ensure that you can clearly see your
            eyes in the live feed (i.e. avoid a backlit background).
          </p>
          <p></p>
        </Modal>
      );
    }

    //check if user has calibrated model (clicked square 10 times) --> if yes, then unlock start presentation button

    if (isCalibrated === false) {
      calibrated = (
        <>
          <Button
            href="/metrics"
            disabled={this.state.isPresentatioView ? true : ""}
            variant="primary"
          >
            View Presentations
          </Button>
          &nbsp;
          <Button disabled variant="primary" onClick={this.onStartPresentation}>
            Start Presentation
          </Button>
        </>
      );
    } else {
      calibrated = (
        <>
          <Button href="/metrics" variant="primary">
            View Presentations
          </Button>
          &nbsp;&nbsp;
          <Button variant="primary" onClick={this.onStartPresentation}>
            Start Presentation
          </Button>
        </>
      );
    }

    //once model is loaded, render red box for clicking to calibrate model

    if (isClickable === true) {
      clickable = (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "10px",
            marginBottom: "15px",
          }}
        >
          <Button variant="primary" onClick={this.incrementClick}>
            Click Here
          </Button>
        </div>
      );
    }

    const isAlert = this.state.isAlert;

    let alert;

    //if any alerts have been triggered by metrics, render central alert

    if (isAlert === true) {
      alert = (
        <Alert visible={true} dismissAriaLabel="Close alert" type="warning">
          One or more of your presentation metrics needs improvement.
        </Alert>
      );
    }

    /**
     * HTML ELEMENTS IN ORDER:
     *
     * Clickable square
     * Navigation bar
     * Alert, loading, and loaded banner
     * Container with webcam and transcription box
     * Presentation time display and welcome modal on login
     * Container box with metrics
     *
     * */
    const { isModalVisible } = this.state;
    return (
      <div>
        <div isClickable={isClickable}>{clickable}</div>
        <div
          isAlert={isAlert}
          style={{ zIndex: "7", position: "absolute", width: "100%" }}
        >
          {alert}
        </div>
        <div
          isLoading={isLoading}
          style={{ zIndex: "5", position: "absolute", width: "100%" }}
        >
          {loading}
        </div>
        <div
          isLoaded={isLoaded}
          style={{ zIndex: "5", position: "absolute", width: "100%" }}
        >
          {loaded}
        </div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Container
            text
            style={{
              marginTop: "1em",
              display: "inline-flex",
              justifyContent: "center",
            }}
          >
            <div>
              <h3>Live Feed</h3>
              <Webcam
                style={{ float: "left", marginRight: "10px" }}
                mirrored="true"
                audio={false}
                videoConstraints={videoConstraints}
              ></Webcam>
            </div>
            <div>
              <h3>Real-Time Transcription</h3>
              <Form style={{ float: "right", marginLeft: "10px" }}>
                <div className="homepage">
                  <ContentEditable
                    id="transcript"
                    disabled={true}
                    className="editable"
                    html={transcriptionHtml + transcriptPiece}
                    name="transcription"
                  />
                </div>
              </Form>
            </div>
          </Container>
        </div>
        <div
          style={{
            paddingTop: "1em",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <h3>
            <Icon name="status-pending"></Icon> Presentation Time
          </h3>
        </div>
        <div
          style={{
            paddingTop: "0.5em",
            paddingBottom: "1em",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <h3>{displayTime}</h3>
        </div>
        <div isModal={isModal}>{modal}</div>
        <PolContainer
          header={
            <Header
              variant="h2"
              description="Real-time analysis of key presentation metrics"
              actions={
                <SpaceBetween direction="horizontal" size="xs">
                  <Box
                    margin={{ right: "l" }}
                    padding={{ right: "l", top: "s" }}
                  >
                    <SpaceBetween direction="horizontal" size="l">
                      {listening ? (
                        <>
                          <Button disabled>View Presentations</Button>
                          <Button
                            style={{ padding: "10px" }}
                            onClick={this.onEndPresentation}
                          >
                            End Presentation
                          </Button>
                        </>
                      ) : (
                        <div isCalibrated={isCalibrated}>{calibrated}</div>
                      )}

                      <div isLanguageSelected={isLanguageSelected}>
                        {languageSelected}
                      </div>
                    </SpaceBetween>
                  </Box>
                </SpaceBetween>
              }
            >
              Presentation Metrics
            </Header>
          }
        >
          <ColumnLayout columns={7} variant="text-grid">
            <div>
              <div style={{ display: "flex" }}>
                <h4 style={{ marginRight: "5px" }}>Eye Contact</h4>

                <Popover
                  dismissAriaLabel="Close"
                  triggerType="custom"
                  fixedWidth
                  header="Eye Contact with Camera"
                  size="large"
                  content={
                    <ColumnLayout columns={2} variant="text-grid">
                      <SpaceBetween size="l">
                        <div>
                          <Box variant="awsui-key-label">Description</Box>
                          <div>
                            The total percentage of time you made eye contact
                            with the camera during your presentation.
                          </div>
                        </div>
                        <div>
                          <Box variant="awsui-key-label">Tip</Box>
                          <div>
                            Looking away for too long can lose that connection
                            with your audience. Remember to practice and prepare
                            so you can look to your audience rather than your
                            notes while presenting.
                          </div>
                        </div>
                      </SpaceBetween>
                      <SpaceBetween size="l">
                        <div>
                          <Box variant="awsui-key-label">Engaged</Box>
                          <div>
                            <p> &gt; 60%</p>
                          </div>
                        </div>
                        <div>
                          <Box variant="awsui-key-label">Distracted</Box>
                          <div>40% - 60%</div>
                        </div>
                        <div>
                          <Box variant="awsui-key-label">Disengaged</Box>
                          <div> &lt; 40%</div>
                        </div>
                      </SpaceBetween>
                    </ColumnLayout>
                  }
                >
                  <StatusIndicator
                    type="info"
                    colorOverride="grey"
                  ></StatusIndicator>
                </Popover>
              </div>
              <p style={{ color: colorEye }}>{eyeMetric}</p>
            </div>
            <div>
              <div style={{ display: "flex" }}>
                <h4 style={{ marginRight: "5px" }}>
                  Speaking Pace (Real-Time)
                </h4>
                <Popover
                  dismissAriaLabel="Close"
                  triggerType="custom"
                  fixedWidth
                  header="Speaking Pace"
                  size="large"
                  content={
                    <ColumnLayout columns={2} variant="text-grid">
                      <SpaceBetween size="l">
                        <div>
                          <Box variant="awsui-key-label">Description</Box>
                          <div>
                            The average speaking pace you are speaking at across
                            the entire presentation.
                          </div>
                        </div>
                        <div>
                          <Box variant="awsui-key-label">Tip</Box>
                          <div>
                            Mix it up! It is important to keep a conversational
                            pace, but try to change your pace to emphasize
                            points in your message and influence the emotions of
                            your audience.
                          </div>
                        </div>
                      </SpaceBetween>
                      <SpaceBetween size="l">
                        <div>
                          <Box variant="awsui-key-label">Slow</Box>
                          <div>
                            <p> &lt; 125 WPM</p>
                          </div>
                        </div>
                        <div>
                          <Box variant="awsui-key-label">Conversational</Box>
                          <div>125 - 150 WPM</div>
                        </div>
                        <div>
                          <Box variant="awsui-key-label">Fast</Box>
                          <div> &gt; 150 WPM</div>
                        </div>
                      </SpaceBetween>
                    </ColumnLayout>
                  }
                >
                  <StatusIndicator
                    type="info"
                    colorOverride="grey"
                  ></StatusIndicator>
                </Popover>
              </div>
              <p style={{ color: colorAvgPace }}>{avgPace}</p>
            </div>
            <div>
              <div style={{ display: "flex" }}>
                <h4 style={{ marginRight: "5px" }}>Speaking Pace (Per Min.)</h4>
                <Popover
                  dismissAriaLabel="Close"
                  triggerType="custom"
                  fixedWidth
                  header="Speaking Pace"
                  size="large"
                  content={
                    <ColumnLayout columns={2} variant="text-grid">
                      <SpaceBetween size="l">
                        <div>
                          <Box variant="awsui-key-label">Description</Box>
                          <div>
                            The pace you are currently speaking at during each
                            minute.
                          </div>
                        </div>
                        <div>
                          <Box variant="awsui-key-label">Tip</Box>
                          <div>
                            Mix it up! It is important to keep a conversational
                            pace, but try to change your pace to emphasize
                            points in your message and influence the emotions of
                            your audience.
                          </div>
                        </div>
                      </SpaceBetween>
                      <SpaceBetween size="l">
                        <div>
                          <Box variant="awsui-key-label">Slow</Box>
                          <div>
                            <p> &lt; 125 WPM</p>
                          </div>
                        </div>
                        <div>
                          <Box variant="awsui-key-label">Conversational</Box>
                          <div>125 - 150 WPM</div>
                        </div>
                        <div>
                          <Box variant="awsui-key-label">Fast</Box>
                          <div> &gt; 150 WPM</div>
                        </div>
                      </SpaceBetween>
                    </ColumnLayout>
                  }
                >
                  <StatusIndicator
                    type="info"
                    colorOverride="grey"
                  ></StatusIndicator>
                </Popover>
              </div>
              <p style={{ color: colorPace }}>{words}</p>
            </div>
            <div>
              <div style={{ display: "flex" }}>
                <h4 style={{ marginRight: "5px" }}>Engagement</h4>
                <Popover
                  dismissAriaLabel="Close"
                  triggerType="custom"
                  fixedWidth
                  header="Last Engagement"
                  size="large"
                  content={
                    <ColumnLayout columns={2} variant="text-grid">
                      <SpaceBetween size="l">
                        <div>
                          <Box variant="awsui-key-label">Description</Box>

                          <div>
                            The amount of time you since last engaged the
                            audience (asked them a question).
                          </div>
                        </div>

                        <div>
                          <Box variant="awsui-key-label">Tip</Box>
                          <div>
                            Pausing during your presentation can also help
                            prompt your audience to ask a question.
                          </div>
                        </div>
                      </SpaceBetween>
                      <SpaceBetween size="l">
                        <div>
                          <Box variant="awsui-key-label">Conversational</Box>
                          <div>
                            <p> &lt; 1 Minute</p>
                          </div>
                        </div>
                        <div>
                          <Box variant="awsui-key-label">One-Sided</Box>
                          <div>1 - 2 Minutes</div>
                        </div>
                        <div>
                          <Box variant="awsui-key-label">Disengaged</Box>
                          <div> &gt; 2 Minutes</div>
                        </div>
                      </SpaceBetween>
                    </ColumnLayout>
                  }
                >
                  <StatusIndicator
                    type="info"
                    colorOverride="grey"
                  ></StatusIndicator>
                </Popover>
              </div>
              <p style={{ color: colorQ }}>{diffDisplay}</p>
            </div>
            <div>
              <div style={{ display: "flex" }}>
                <h4 style={{ marginRight: "5px" }}>Filler Words</h4>
                <Popover
                  dismissAriaLabel="Close"
                  triggerType="custom"
                  fixedWidth
                  header="Filler Words Used"
                  size="large"
                  content={
                    <ColumnLayout columns={2} variant="text-grid">
                      <SpaceBetween size="l">
                        <div>
                          <Box variant="awsui-key-label">Description</Box>
                          <div>
                            The number of filler words (i.e. "um", "like", etc.)
                            used in your presentation.
                          </div>
                        </div>
                        <div>
                          <Box variant="awsui-key-label">Tip</Box>
                          <div>
                            Instead of using a filler word to fill in gaps, take
                            a pause instead to think about how you want to
                            articulate your message.
                          </div>
                        </div>
                      </SpaceBetween>
                      <SpaceBetween size="l">
                        <div>
                          <Box variant="awsui-key-label">Prepared</Box>
                          <div>
                            <p> &lt; 10</p>
                          </div>
                        </div>
                        <div>
                          <Box variant="awsui-key-label">Need Practice</Box>
                          <div>10 - 20</div>
                        </div>
                        <div>
                          <Box variant="awsui-key-label">Unprepared</Box>
                          <div> &gt; 20</div>
                        </div>
                      </SpaceBetween>
                    </ColumnLayout>
                  }
                >
                  <StatusIndicator
                    type="info"
                    colorOverride="grey"
                  ></StatusIndicator>
                </Popover>
              </div>
              <p style={{ color: colorFiller }}>{filler}</p>
            </div>
            <div>
              <div style={{ display: "flex" }}>
                <h4 style={{ marginRight: "5px" }}>Weasel Words</h4>
                <Popover
                  dismissAriaLabel="Close"
                  triggerType="custom"
                  fixedWidth
                  header="Weasel & Bias Words Used"
                  size="large"
                  content={
                    <ColumnLayout columns={2} variant="text-grid">
                      <SpaceBetween size="l">
                        <div>
                          <Box variant="awsui-key-label">Description</Box>
                          <div>
                            The number of weasel and bias words used in your
                            presentation.
                          </div>
                        </div>
                        <div>
                          <Box variant="awsui-key-label">Tip</Box>
                          <div>
                            Guessing and overpromising can do more harm than
                            good when answering questions. If you are unsure
                            about something, let your audience know and get back
                            to them later.
                          </div>
                        </div>
                      </SpaceBetween>
                      <SpaceBetween size="l">
                        <div>
                          <Box variant="awsui-key-label">Prepared</Box>
                          <div>
                            <p> &lt; 10 Words / Phrases</p>
                          </div>
                        </div>
                        <div>
                          <Box variant="awsui-key-label">Needs Practice</Box>
                          <div>10 - 20 Words / Phrases</div>
                        </div>
                        <div>
                          <Box variant="awsui-key-label">Unprepared</Box>
                          <div> &gt; 20 Words / Phrases</div>
                        </div>
                      </SpaceBetween>
                    </ColumnLayout>
                  }
                >
                  <StatusIndicator
                    type="info"
                    colorOverride="grey"
                  ></StatusIndicator>
                </Popover>
              </div>
              <p style={{ color: colorWeasel }}>{weasel}</p>
            </div>
            <div>
              <div style={{ display: "flex" }}>
                <h4 style={{ marginRight: "5px" }}>
                  Bias, Emotion & Specificity Words
                </h4>
                <Popover
                  dismissAriaLabel="Close"
                  triggerType="custom"
                  fixedWidth
                  header="Bias, Emotion & Specificity Words"
                  size="large"
                  content={
                    <ColumnLayout columns={2} variant="text-grid">
                      <SpaceBetween size="l">
                        <div>
                          <Box variant="awsui-key-label">Description</Box>
                          <div>
                            The number of bias/biased, emotional, and specific
                            words used in your presentation.
                          </div>
                        </div>
                        <div>
                          <Box variant="awsui-key-label">Tip</Box>
                          <div>
                            Presenting in a neutral manner can help you avoid
                            conveying bias and emotion, which can impact an
                            audience's overall perspective.
                          </div>
                        </div>
                      </SpaceBetween>
                      <SpaceBetween size="l">
                        <div>
                          <Box variant="awsui-key-label">Prepared</Box>
                          <div>
                            <p> &lt; 10 Words / Phrases</p>
                          </div>
                        </div>
                        <div>
                          <Box variant="awsui-key-label">Needs Practice</Box>
                          <div>10 - 20 Words / Phrases</div>
                        </div>
                        <div>
                          <Box variant="awsui-key-label">Unprepared</Box>
                          <div> &gt; 20 Words / Phrases</div>
                        </div>
                      </SpaceBetween>
                    </ColumnLayout>
                  }
                >
                  <StatusIndicator
                    type="info"
                    colorOverride="grey"
                  ></StatusIndicator>
                </Popover>
              </div>
              <p style={{ color: colorBias }}>{g1}</p>
            </div>
          </ColumnLayout>
        </PolContainer>
        ;
      </div>
    );
  }
}
