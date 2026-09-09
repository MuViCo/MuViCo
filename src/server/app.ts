import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
import morgan from "morgan"
import mongoose from "mongoose"
import path from "path"

import * as config from "./utils/config"
import * as logger from "./utils/logger"

import signupRouter from "./routes/signup"
import loginRouter from "./routes/login"
import presentationsRouter from "./routes/presentations"
import presentationRouter from "./routes/presentation"
import termsRouter from "./routes/terms"
import adminRouter from "./routes/admin"
import * as middleware from "./utils/middleware"
import driveProxy from "./routes/driveProxy"
import usersRouter from "./routes/users"
// Imported here but still only mounted below under NODE_ENV=test
import testingRouter from "./routes/testing"

// Set by @shelf/jest-mongodb's globalSetup for the Backend test project.
declare global {
  var __MONGO_URI__: string | undefined
}

const app = express()

mongoose.set("strictQuery", false)

// This has always logged "undefined" (the JSON.stringify result is never
// returned) -- left as-is, fixing it would start logging request bodies
morgan.token("data", (req) => {
  if (req.method === "POST") {
    JSON.stringify((req as express.Request).body)
  }
  return undefined
})

if (process.env.NODE_ENV === "test" && global.__MONGO_URI__) {
  mongoose.connect(global.__MONGO_URI__)
} else {
  mongoose
    .connect(config.MONGODB_URI as string)
    .then(() => {
      logger.info("connected to MongoDB")
    })
    .catch((error) => {
      logger.error("error connection to MongoDB:", (error as Error).message)
    })
}

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
if (process.env.NODE_ENV !== "test") {
  app.use(
    morgan(
      ":method :url :status :res[content-length] - :response-time ms :data"
    )
  )
}

app.use("/api/login", loginRouter)
app.use("/api/signup", signupRouter)
app.use("/api/home", presentationsRouter)
app.use("/api/presentation", presentationRouter)
app.use("/api/terms", termsRouter)
app.use("/api/admin", adminRouter)
app.use("/api/media", driveProxy)
app.use("/api/users", usersRouter)

if (process.env.NODE_ENV === "production") {
  const DIST_PATH = path.resolve(__dirname, "../../dist/")
  const INDEX_PATH = path.resolve(DIST_PATH, "index.html")

  app.use(express.static(path.join(__dirname, "public")))
  app.use(express.static(DIST_PATH))
  app.get("*", (_, res) => res.sendFile(INDEX_PATH))
}

if (process.env.NODE_ENV === "test") {
  app.use("/api/testing", testingRouter)
}

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

export = app
