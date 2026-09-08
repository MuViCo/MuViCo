/*
 * Configuration utility for server environment variables.
 * Loads .env values and exposes runtime config, including test-safe MongoDB URI selection.
 */
require("dotenv").config()

const {
  PORT,
  SECRET,
  BUCKET_NAME,
  BUCKET_REGION,
  ACCESS_KEY,
  SECRET_ACCESS_KEY,
  PUBLIC_S3_ENDPOINT,
  PRIVATE_S3_ENDPOINT,
  FIREBASE_SERVICE_KEY,
} = process.env

const MONGODB_URI =
  process.env.NODE_ENV === "test"
    ? process.env.TEST_MONGODB_URI
    : process.env.MONGODB_URI

module.exports = {
  MONGODB_URI,
  PORT,
  SECRET,
  BUCKET_NAME,
  BUCKET_REGION,
  ACCESS_KEY,
  SECRET_ACCESS_KEY,
  PUBLIC_S3_ENDPOINT,
  PRIVATE_S3_ENDPOINT,
  FIREBASE_SERVICE_KEY,
}
