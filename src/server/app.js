const config = require("./utils/config");
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const morgan = require("morgan");
const mongoose = require("mongoose");

const logger = require("./utils/logger");

const indexRouter = require("./routes/index");
const signupRouter = require("./routes/signup");
const loginRouter = require("./routes/login");
const presentationsRouter = require("./routes/presentations");
const presentationRouter = require("./routes/presentation");
const connectionsRouter = require("./routes/connections");

const middleware = require("./utils/middleware");

const photoRouter = require("./routes/photos");

const app = express();

mongoose.set("strictQuery", false);

morgan.token("data", (req, res) => {
  if (req === "POST") {
    JSON.stringify(req.body);
  }
});

mongoose
  .connect(config.MONGODB_URI)
  .then(() => {
    logger.info("connected to MongoDB");
  })
  .catch((error) => {
    logger.error("error connection to MongoDB:", error.message);
  });

const allowedOrigins = [
  "https://muvico-hy-ohtuprojekti-staging.apps.ocp-test-0.k8s.it.helsinki.fi/",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: allowedOrigins,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms :data")
);
//app.use(middleware.requestLogger);

app.use("/", indexRouter);
app.use("/api/login", loginRouter);
app.use("/api/signup", signupRouter);
app.use("/api/home", presentationsRouter);
app.use("/api/presentation", presentationRouter);
app.use("/api/photos", photoRouter); // Mount your photo router to /api/photos
app.use("/api/connections", connectionsRouter);

app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);

module.exports = app;
