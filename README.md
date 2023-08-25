
<h1 align="center">
  <br>
  aws-presentation-evaluation-tool
  <br>
</h1>

<!--BEGIN STABILITY BANNER-->

<h4 align="center">A web application built on AWS that coaches users to create a successful presentation</a>.</h4>

<p align="center">
  <a href="#overview">Overview</a> •
  <a href="#setup">Setup</a> •
  <a href="#build">Build</a> •
  <a href="#deploy">Deploy</a> •
</p>

![Stability: Experimental](https://img.shields.io/badge/stability-Experimental-important.svg?style=for-the-badge)

> **This is an experimental example. It may not build out of the box**
>
> This examples is built on an Amplify project marked "Experimental" and may not be updated for latest breaking changes.
>
> It additionally requires infrastructure prerequisites that must be created before successful build.
>
> If build is unsuccessful, please create an [issue](https://github.com/aws-samples/aws-cdk-examples/issues/new) so that we may debug the problem 

---
<!--END STABILITY BANNER-->

## Overview

Public speaking skills are fundamental for professional development, regardless of industry. Dry-runs and feedback are vital to improve communication and build leadership skills. It can be difficult to get quantifiable, unbiased and actionable insights when dry-running alone. ​While rehearsing in front of others can offer valuable feedback, finding a human audience can be intimidating, time-consuming and may not always be feasible. 

aws-presentation-evaluation-tool is a scalable solution that integrates ML services with video streaming in order to extract insights that define a successful presentation (i.e. words-per-minutes, eye contact, filler words, weasel words, and more.). Using services such as Transcribe, Comprehend and models such as [PoseNet](https://github.com/tensorflow/tfjs-models/tree/master/posenet), aws-presentation-evaluation-tool analyzes presenters and generates instant reports that provides insights into user presentations, as well as real-time prompts on areas to improve.

![alt text](./wpt.png "aws-presentation-evaluation-tool Architecture")

Before deploying this application, you will need to install the [Amplify CLI](https://docs.amplify.aws/cli/start/install/) and the [AWS Cloud Development Kit (CDK)](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html).


## Setup
clone the repo:

```bash
git clone https://github.com/aws-samples/aws-presentation-evaluation-tool.git .
```

## Build

To build this app, you need to be in this project's root folder. Then run the following:

```bash
cd amplify-deployable
npm install --legacy-peer-deps
amplify init
```

This will install the necessary node packages and bootstrap the Amplify environment for deployment.

## Deploy

Run `amplify push`. This will deploy / redeploy your Amplify to your AWS Account.

After the deployment you will see the Amplify URL, which represents the url hosting the web app.

Happy presenting:)

