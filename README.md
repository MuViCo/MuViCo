# MuViCo

![CI Badge](https://github.com/MuViCo/MuViCo/workflows/CI/badge.svg)
[![codecov](https://codecov.io/github/MuViCo/MuViCo/graph/badge.svg?token=B5NR45ODV2)](https://codecov.io/github/MuViCo/MuViCo)

### Introduction

MuviCo is a multimodal application designed to provide versatile visual elements and support functions for live music performances. The purpose of the application is to bring an additional dimension to music experiences that can complement and enrich the experience for both listeners and performers. The program is browser-based and intended to operate on computers.

The application displays lyrics, images, or AI-generated visuals to enhance the musical experience. Additionally, it reflects the lyrics to support the singer. All performances can be pre-planned or guided in real-time.

### Used technologies

#### Backend
- [Node.js](https://nodejs.org/en/learn/getting-started/introduction-to-nodejs)
- [Express.js](https://expressjs.com/en/5x/api.html)

#### Frontend
- [React](https://react.dev/learn)
- JavaScript (ES6+)

#### Testing
- [Jest](https://jestjs.io/docs/tutorial-react)
- [Cypress](https://docs.cypress.io/guides/overview/why-cypress)

#### Database
- [mongodb](https://www.mongodb.com/)

### Use

The app can be used by signing up and logging in. On the home page the user can create a new 'presentation' or view their previous presentations. A presentation in this case refers to a collection of media, which is intended to be used in a concert setting. On the presentation page the user can add 'cues' in which singular pieces of media are stored. Once the user enters 'Show mode' the cues can be activated. Each cue is linked to a screen on which the media will be presented. There's no upper limit to the number of windows used, but it's good to keep in mind, that an upper limit for a single computer's screens exists.

The cues are differentiated by their 'screen' and 'index' values. Cues with the same 'screen' are shown in the same pop up window, while cues with the same 'index' are activated simultaneously. This allows the user to control media on several screens independently. A user can delete a presentation or cues thereof, which also deletes the media of said presentation / cue.

Currently the application is running on a staging server, which, for security reasons is not made public. The deployment server will be publicly available soon.

### Documentation

The latest component diagram can be viewed [here](https://github.com/MuViCo/MuViCo/blob/documentation/documentation/architecture/sprint%202.png).
