const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");
const loginRouter = require("./routes/login");
const morgan = require("morgan");

const app = express();

morgan.token("data", (req, res) => {
  if (req === "POST") {
    JSON.stringify(req.body);
  }
});
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms :data")
);
app.use("/", indexRouter);
app.use("/asd", usersRouter);
app.use("/users", usersRouter);
app.use("/login", loginRouter);

module.exports = app;
