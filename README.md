![MuViCo in Concert](./muvico-in-concert.png)

# MuViCo

[![Test and deploy to staging](https://github.com/MuViCo/MuViCo/actions/workflows/staging.yml/badge.svg)](https://github.com/MuViCo/MuViCo/actions/workflows/staging.yml)
[![codecov](https://codecov.io/github/MuViCo/MuViCo/graph/badge.svg?token=B5NR45ODV2)](https://codecov.io/github/MuViCo/MuViCo)

### Introduction

MuviCo is a browser-based application designed to provide versatile visual elements and support functions for live music performances. The purpose of the application is to bring an additional dimension to music experiences that can complement and enrich the experience for both listeners and performers.

With MuViCo you can easily add, assemble and edit video, image and audio elements on an interactive interface. Your projects are saved to the cloud, so they can be accessed from any device at any time.

### Used technologies

#### Backend

- [Node.js](https://nodejs.org/en/learn/getting-started/introduction-to-nodejs)
- [Express.js](https://expressjs.com/en/5x/api.html)

#### Frontend

- [React](https://react.dev/learn)
- JavaScript (ES6+)

#### Testing

- [Jest](https://jestjs.io/docs/tutorial-react)

#### Database

- [mongodb](https://www.mongodb.com/)

### Use

The app can be used by signing up and logging in. The user can log in with a Google account or create a new account to MuViCo. On the home page the user can create a new presentation or view their previous presentations. A presentation in this case refers to a collection of media, which is intended to be used in a performance setting.

Elements are slots in which singular pieces of media are stored. On the presentation page, the user can add elements either by manually clicking the 'Add element'-button, by double clicking on a free spot in the interface, or by drag-and-dropping files directly to the interface. The user can then edit existing elements for example by dragging a new piece of media on top of the element or by double clicking the element to change the position, element name or media. Changes are saved automatically.

Once the user enters 'Show mode' the elements can be activated. Each element is linked to a screen on which the media will be presented. The presentation can also be edited during Show mode and changes will be saved.

The elements are differentiated by their 'screen' and 'index' values. Elements with the same 'screen' are shown in the same pop up window, while elements with the same 'index' are activated simultaneously. This allows the user to control media on several screens independently. A user can delete a presentation or element, which also deletes the media of said presentation / element.

### Documentation

For detailed instructions on how to use the application check out the [User Guide](https://github.com/MuViCo/MuViCo/blob/main/documentation/userguide.md)

For more information check out the [documentation folder](https://github.com/MuViCo/MuViCo/tree/main/documentation).

## Development

### Getting Started with Development

Follow these steps to set up the project on your local machine:

1. **Install Required Tools**  
   Ensure you have the following installed on your system:

   - [Node.js and npm](https://nodejs.org/)
   - [Docker](https://www.docker.com/)
   - [Docker Compose](https://docs.docker.com/compose/)

2. **Clone the Repository**  
   Clone the project repository to your local machine:

   ```bash
   git clone git@github.com:MuViCo/MuViCo.git
   ```

3. **Navigate to the Project Directory**  
   Change to the project root directory:

   ```bash
   cd MuViCo
   ```

4. **Set Up Environment Variables**  
   Copy the `.env-template` file to `.env` and fill in the required values:

   ```bash
   cp .env-template .env
   ```

5. **Install Dependencies**  
   Install the required npm dependencies:

   ```bash
   npm install
   ```

6. **Run the Application in Development Mode**  
    Start the application in development mode with hot-reloading:
   ```bash
   npm run dev
   ```
   This will start the backend server and the frontend development server with live updates.

### Developing the Application in Docker

If you prefer to develop inside a Docker container (to match the production environment), follow these steps:

1. **Reset the Docker Environment**  
   Clean up any existing Docker containers and volumes:

   ```bash
   npm run reset
   ```

2. **Install Dependencies**  
   Install dependencies inside the container:

   ```bash
   npm ci
   ```

3. **Cleaning Up Docker Environment**

   To free up space and avoid conflicts with old Docker artifacts, you can remove all unused Docker data, including stopped containers, unused images, and networks, by running:

   ```bash
   docker system prune -a
   ```

4. **Start the Application**  
   Start the application in development mode using Docker:

   ```bash
   npm run start
   ```
   This will spin up the necessary containers for the backend, frontend, and database.

### Running the Application in Production Mode

To simulate the production environment locally, follow these steps:

1. **Reset the Production Docker Environment**  
   Clean up any existing production containers and volumes:

   ```bash
   npm run reset-prod
   ```

2. **Start the Application in Production Mode**  
   Start the application using the production Docker configuration:

   ```bash
   npm run start-prod
   ```
   This will build and run the application in a production-like environment.

### Note on Branch Switching

When switching to a new branch, it is recommended to run the following command to ensure that the dependencies are consistent with the branch you are switching to:

```bash
npm ci
```
