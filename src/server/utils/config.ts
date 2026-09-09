/*
 * Configuration utility for server environment variables.
 * Loads .env values and exposes runtime config, including test-safe MongoDB URI selection.
 */
import dotenv from "dotenv"

dotenv.config()

export const PORT = process.env.PORT
export const SECRET = process.env.SECRET
export const BUCKET_NAME = process.env.BUCKET_NAME
export const BUCKET_REGION = process.env.BUCKET_REGION
export const ACCESS_KEY = process.env.ACCESS_KEY
export const SECRET_ACCESS_KEY = process.env.SECRET_ACCESS_KEY
export const PUBLIC_S3_ENDPOINT = process.env.PUBLIC_S3_ENDPOINT
export const PRIVATE_S3_ENDPOINT = process.env.PRIVATE_S3_ENDPOINT
export const FIREBASE_SERVICE_KEY = process.env.FIREBASE_SERVICE_KEY

export const MONGODB_URI =
  process.env.NODE_ENV === "test"
    ? process.env.TEST_MONGODB_URI
    : process.env.MONGODB_URI
