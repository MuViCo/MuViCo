require("dotenv").config()

const { PORT } = process.env
const MONGODB_URI =
  process.env.NODE_ENV === "test"
    ? process.env.TEST_MONGODB_URI
    : process.env.MONGODB_URI
const { SECRET } = process.env
const { BUCKET_NAME } = process.env
const { AWS_REGION } = process.env
const { AWS_ACCESS_KEY_ID } = process.env
const { AWS_SECRET_ACCESS_KEY } = process.env

module.exports = {
  MONGODB_URI,
  PORT,
  SECRET,
  BUCKET_NAME,
  AWS_REGION,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
}
