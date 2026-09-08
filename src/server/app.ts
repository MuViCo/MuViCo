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
// Statically imported rather than required only under NODE_ENV=test, like
// the original: it's still mounted only in the test branch below, and a
// static import is what a CommonJS-target `import` lowers to anyway --
// there's no bundle size to save by deferring it.
import testingRouter from "./routes/testing"

// Set by @shelf/jest-mongodb's globalSetup for the Backend test project.
declare global {
  var __MONGO_URI__: string | undefined
}

const app = express()

mongoose.set("strictQuery", false)

// Pre-existing dead code, left behaving exactly as before: the original
// compared the whole request object to the string "POST" (always false,
// which TS rejects outright -- no overlap between the two types), and even
// with that fixed to req.method, the JSON.stringify result was never
// returned. So this token has always logged "undefined" regardless of
// method; fixing either half would start actually logging request bodies,
// which is a behaviour change and arguably not one to make silently here.
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
