# MuViCo

![CI Badge](https://github.com/MuViCo/MuViCo/workflows/CI/badge.svg)
[![codecov](https://codecov.io/github/MuViCo/MuViCo/graph/badge.svg?token=B5NR45ODV2)](https://codecov.io/github/MuViCo/MuViCo)

### Introduction

MuviCo is a browser-based application designed to provide versatile visual elements and support functions for live music performances. The purpose of the application is to bring an additional dimension to music experiences that can complement and enrich the experience for both listeners and performers.

With MuViCo you can easily add, assemble and edit video and image cues on an interactive interface. Your projects are saved to the cloud, so they can be accessed from any device at any time. Presentations can also be edited on the fly during a performance for ultimate flexibility.


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

The app can be used by signing up and logging in. The user can log in with a Google account or create a new account to MuViCo. On the home page the user can create a new presentation or view their previous presentations. A presentation in this case refers to a collection of media, which is intended to be used in a performance setting. 

Cues are slots in which singular pieces of media are stored. On the presentation page, the user can add cues either by manually clicking the 'Add cue'-button, by double clicking on a free spot in the interface, or by drag-and-dropping files directly to the interface. The user can then edit existing cues for example by dragging a new piece of media on top of the cue or by double clicking the cue to change the position, cue name or media. Changes are saved automatically.

Once the user enters 'Show mode' the cues can be activated. Each cue is linked to a screen on which the media will be presented. The presentation can also be edited during Show mode and changes will be saved.

The cues are differentiated by their 'screen' and 'index' values. Cues with the same 'screen' are shown in the same pop up window, while cues with the same 'index' are activated simultaneously. This allows the user to control media on several screens independently. A user can delete a presentation or cue, which also deletes the media of said presentation / cue.

Currently the application is running on a staging server, which, for security reasons is not made public. The deployment server will be publicly available soon.

### Documentation

For detailed instructions on how to use the application check out the [User Guide](https://github.com/MuViCo/MuViCo/blob/3fa0f45fdeec4fe03a244c961004a385991dd78b/documentation/userguide.md)

The latest component diagram can be viewed [here](https://github.com/MuViCo/MuViCo/blob/documentation/documentation/architecture/sprint%202.png).

## Development

1. Install npm, docker and docker compose
2. Clone repository to local machine `git clone git@github.com:MuViCo/MuViCo.git`
3. Change directory to project root `cd MuViCo`
4. Copy .env-template as .env and fill the required values
5. Install depedencies `npm i`
6. Run `npm start`

Note: You can also start developing by just running `npm run dev` after all dependencies are installed and .env is configured
