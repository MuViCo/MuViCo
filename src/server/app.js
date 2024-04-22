const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")
const morgan = require("morgan")
const mongoose = require("mongoose")
const path = require("path")
const config = require("./utils/config")

const logger = require("./utils/logger")

const signupRouter = require("./routes/signup")
const loginRouter = require("./routes/login")
const presentationsRouter = require("./routes/presentations")
const presentationRouter = require("./routes/presentation")
const termsRouter = require("./routes/terms")
const adminRouter = require("./routes/admin")
const middleware = require("./utils/middleware")

const app = express()

mongoose.set("strictQuery", false)

morgan.token("data", (req, res) => {
  if (req === "POST") {
    JSON.stringify(req.body)
  }
})

mongoose
  .connect(config.MONGODB_URI)
  .then(() => {
    logger.info("connected to MongoDB")
  })
  .catch((error) => {
    logger.error("error connection to MongoDB:", error.message)
  })

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms :data")
)

app.use("/api/login", loginRouter)
app.use("/api/signup", signupRouter)
app.use("/api/home", presentationsRouter)
app.use("/api/presentation", presentationRouter)
app.use("/api/terms", termsRouter)
app.use("/api/admin", adminRouter)

if (process.env.NODE_ENV === "production") {
  const DIST_PATH = path.resolve(__dirname, "../../dist/")
  const INDEX_PATH = path.resolve(DIST_PATH, "index.html")

  app.use(express.static(path.join(__dirname, "public")))
  app.use(express.static(DIST_PATH))
  app.get("*", (_, res) => res.sendFile(INDEX_PATH))
}
if (process.env.NODE_ENV === "test") {
  // eslint-disable-next-line global-require
  const testingRouter = require("./routes/testing")
  app.use("/api/testing", testingRouter)
}

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

module.exports = app
