// copied from https://github.com/aws-samples/medical-transcription-analysis/
// and modified to current application.
import { countWords } from '../metrics/Pace';
import { getTime, getLanguage } from '../pages/Home';
import { findFiller } from '../metrics/Filler';
import { findWeasel } from '../metrics/Weasel';
import { findBiasEmotionSpecificity } from '../metrics/Bias_Emotion_Specificity';
const audioUtils = require('./audioUtils');  // for encoding audio data as PCM
const crypto = require('crypto'); // tot sign our pre-signed URL
const v4 = require('./aws-signature-v4'); // to generate our pre-signed URL
const marshaller = require("@aws-sdk/eventstream-marshaller"); // for converting binary event stream messages to and from JSON
const util_utf8_node = require("@aws-sdk/util-utf8-node"); // utilities for encoding and decoding UTF8
const mic = require('microphone-stream'); // collect microphone input as a stream of raw bytes


//const start = new Date()
// our converter between binary event streams messages and JSON
const eventStreamMarshaller = new marshaller.EventStreamMarshaller(util_utf8_node.toUtf8, util_utf8_node.fromUtf8);
export function startAudio(toggleStartStop, getTranscript, clientCredentials, words, setTimeStamp, setWordCount, setMinute, setAvg, setFiller, setWeasel, setBiasEmotionSpec) {

    window.navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true
    })
        .then((medStream) => streamAudioToWebSocket(medStream, toggleStartStop, getTranscript, clientCredentials, words, setTimeStamp, setWordCount, setMinute, setAvg, setFiller, setWeasel, setBiasEmotionSpec))
        .catch(function (error) {
            console.log('There was an error streaming your audio to Amazon Transcribe. Please try again.');
            toggleStartStop();
        });
    toggleStartStop();
}

let languageCode
let languageChosen
let region = "us-east-1";
let sampleRate = 44100;
let inputSampleRate;
let transcription = "";
let socket;
let micStream;
let socketError = false;
let transcribeException = false;
let y = 0;


function streamAudioToWebSocket(userMediaStream, toggleStartStop, getTranscript, clientCredentials, words, setTimeStamp, setWordCount, setMinute, setAvg, setFiller, setWeasel, setBiasEmotionSpec) {
    //let's get the mic input from the browser, via the microphone-stream module
    micStream = new mic();
    micStream.on("format", function (data) {
        inputSampleRate = data.sampleRate;
    });
    micStream.setStream(userMediaStream);
    // Pre-signed URLs are a way to authenticate a request (or WebSocket connection, in this case)
    // via Query Parameters. Learn more: https://docs.aws.amazon.com/AmazonS3/latest/API/sigv4-query-string-auth.html
    let url = createPresignedUrl(clientCredentials);
    //open up our WebSocket connection
    socket = new WebSocket(url);
    socket.binaryType = "arraybuffer";
    let sampleRate = 0;
    // when we get audio data from the mic, send it to the WebSocket if possible
    socket.onopen = function () {
        micStream.on('data', function (rawAudioChunk) {
            //("received data from mic ...")
            // the audio stream is raw audio bytes. Transcribe expects PCM with additional metadata, encoded as binary
            let binary = convertAudioToBinaryMessage(rawAudioChunk);
            if (socket.readyState === socket.OPEN)
                socket.send(binary);
        }
        )
    };
    // handle messages, errors, and close events
    wireSocketEvents(toggleStartStop, getTranscript, words, setTimeStamp, setWordCount, setMinute, setAvg, setFiller, setWeasel, setBiasEmotionSpec);
}
function wireSocketEvents(toggleStartStop, getTranscript, words, setTimeStamp, setWordCount, setMinute, setAvg, setFiller, setWeasel, setBiasEmotionSpec) {
    // handle inbound messages from Amazon Transcribe
    socket.onmessage = function (message) {
        //convert the binary event stream message to JSON
        let messageWrapper = eventStreamMarshaller.unmarshall(Buffer(message.data));
        let messageBody = JSON.parse(String.fromCharCode.apply(String, messageWrapper.body));
        if (messageWrapper.headers[":message-type"].value === "event") {
            handleEventStreamMessage(messageBody, getTranscript, words, setTimeStamp, setWordCount, setMinute, setAvg, setFiller, setWeasel, setBiasEmotionSpec);
        }
        else {
            transcribeException = true;
            showError(messageBody.Message);
            toggleStartStop();
        }
    };
    socket.onerror = function () {
        socketError = true;
        showError('WebSocket connection error. Try again.');
        toggleStartStop();
    };

    socket.onclose = function (closeEvent) {
        console.log("WebSocket closed")
        micStream.stop();

        // the close event immediately follows the error event; only handle one.
        if (!socketError && !transcribeException) {
            if (closeEvent.code != 1000) {
                showError('</i><strong>Streaming Exception</strong><br>' + closeEvent.reason);
            }
            toggleStartStop();
        }
    };
}
let handleEventStreamMessage = function (messageJson, getTranscript, words, setTimeStamp, setWordCount, setMinute, setAvg, setFiller, setWeasel, setBiasEmotionSpec) {
    let results = messageJson.Transcript.Results;

    if (results.length > 0) {
        if (results[0].Alternatives.length > 0) {
            let transcript = results[0].Alternatives[0].Transcript;
            // fix encoding for accented characters
            transcript = decodeURIComponent(escape(transcript));

            // update the textarea with the latest result
            getTranscript(transcript, false);
            // if this transcript segment is final, add it to the overall transcription
            if (!results[0].IsPartial) {
                //scroll the textarea down
                var objDiv = document.getElementById("transcript");
                objDiv.scrollTop = objDiv.scrollHeight
                transcription += transcript + "\n";
                getTranscript(transcript, true); //this portion will take the outputted sentence and find word count
                var str = transcript
                // countWords(transcription);
                var x = getTime()
                var currentTime = x / 1000

                //pass transcript and current time to appropriate functions for computation
                countWords(setWordCount, transcript, currentTime, setMinute, setAvg)
                findFiller(transcript, words.filler, setFiller)
                findWeasel(transcript, words.weasel, setWeasel)
                findBiasEmotionSpecificity(transcript, words.specificity, words.bias, words.emotion, setBiasEmotionSpec)
            }
        }
    }
}



function convertAudioToBinaryMessage(audioChunk) {
    let raw = mic.toRaw(audioChunk);
    if (raw == null)
        return;
    // downsample and convert the raw audio bytes to PCM
    let downsampledBuffer = audioUtils.downsampleBuffer(raw, inputSampleRate, sampleRate);
    let pcmEncodedBuffer = audioUtils.pcmEncode(downsampledBuffer);
    // add the right JSON headers and structure to the message
    let audioEventMessage = getAudioEventMessage(Buffer.from(pcmEncodedBuffer));
    //convert the JSON object + headers into a binary event stream message
    let binary = eventStreamMarshaller.marshall(audioEventMessage);
    return binary;
}
function getAudioEventMessage(buffer) {
    // wrap the audio data in a JSON envelope
    return {
        headers: {
            ':message-type': {
                type: 'string',
                value: 'event'
            },
            ':event-type': {
                type: 'string',
                value: 'AudioEvent'
            }
        },
        body: buffer
    };
}

function createPresignedUrl(clientCredentials) {
    let endpoint = "transcribestreaming." + region + ".amazonaws.com:8443";
    // get a preauthenticated URL that we can use to establish our WebSocket
    languageChosen = getLanguage()

    if (languageChosen === "English") {
        languageCode = "en-US"
    } else if (languageChosen === "French") {
        languageCode = "fr-FR";
    } else if (languageChosen === "French-Canadian") {
        languageCode = "fr-CA";
    } else if (languageChosen === "Spanish") {
        languageCode = "es-US";
    } else if (languageChosen === "Portugese") {
        languageCode = "pt-BR";
    } else if (languageChosen === "Japanese") {
        languageCode = "ja-JP";
    } else if (languageChosen === "Italian") {
        languageCode = "it-IT";
    } else if (languageChosen === "German") {
        languageCode = "de-DE";
    } else if (languageChosen === "Chinese-Mandarin") {
        languageCode = "zh-CN";
    }

    return v4.createPresignedURL(
        'GET',
        endpoint,
        '/stream-transcription-websocket',
        'transcribe',
        crypto.createHash('sha256').update('', 'utf8').digest('hex'), {
        'key': clientCredentials.accessKeyId,
        'secret': clientCredentials.secretAccessKey,
        'sessionToken': clientCredentials.sessionToken,
        'protocol': 'wss',
        'expires': 15,
        'region': region,
        'query': "language-code=" + languageCode + "&media-encoding=pcm&sample-rate=" + sampleRate
    }
    );
}
function showError(message) {
    console.error(message);
}
let closeSocket = function () {
    if (socket.readyState === socket.OPEN) {
        micStream.stop();
        // Send an empty frame so that Transcribe initiates a closure of the WebSocket after submitting all transcripts
        let emptyMessage = getAudioEventMessage(Buffer.from(new Buffer([])));
        let emptyBuffer = eventStreamMarshaller.marshall(emptyMessage);
        socket.send(emptyBuffer);
    }
}
export function stopAudio() {
    closeSocket();
}