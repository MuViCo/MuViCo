require("dotenv").config()

let PORT = process.env.PORT
const MONGODB_URI =
  process.env.NODE_ENV === "test"
    ? process.env.TEST_MONGODB_URI
    : process.env.MONGODB_URI
let SECRET = process.env.SECRET
let BUCKET_NAME = process.env.BUCKET_NAME
let BUCKET_REGION = process.env.BUCKET_REGION
let ACCESS_KEY = process.env.ACCESS_KEY
let SECRET_ACCESS_KEY = process.env.SECRET_ACCESS_KEY


module.exports = {
  MONGODB_URI,
  PORT,
  SECRET,
  BUCKET_NAME,
  BUCKET_REGION,
  ACCESS_KEY,
  SECRET_ACCESS_KEY
}
