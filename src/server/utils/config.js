require("dotenv").config()

const { PORT } = process.env
const MONGODB_URI =
  process.env.NODE_ENV === "test"
    ? process.env.TEST_MONGODB_URI
    : process.env.MONGODB_URI
const { SECRET } = process.env
const { BUCKET_NAME } = process.env
const { BUCKET_REGION } = process.env
const { ACCESS_KEY } = process.env
const { SECRET_ACCESS_KEY } = process.env

module.exports = {
  MONGODB_URI,
  PORT,
  SECRET,
  BUCKET_NAME,
  BUCKET_REGION,
  ACCESS_KEY,
  SECRET_ACCESS_KEY,
}
