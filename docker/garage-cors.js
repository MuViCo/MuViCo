/*
 * One-shot CORS setup for the bundled local Garage instance.
 *
 * The browser reads cue media straight from object storage through presigned
 * URLs, and the storage is served from a different port than the app, so it
 * needs CORS headers to be allowed to read those responses. Garage exposes no
 * CLI for this, only the S3 PutBucketCors call, hence this script.
 *
 * Run by the `garage-init` service in compose.yaml; not used in production,
 * where the bucket CORS policy is managed by the storage provider.
 */
const { S3Client, PutBucketCorsCommand } = require("@aws-sdk/client-s3")

const {
  PRIVATE_S3_ENDPOINT,
  BUCKET_NAME,
  BUCKET_REGION,
  ACCESS_KEY,
  SECRET_ACCESS_KEY,
  S3_CORS_ALLOWED_ORIGINS,
} = process.env

const allowedOrigins = (S3_CORS_ALLOWED_ORIGINS || "*")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean)

const s3 = new S3Client({
  endpoint: PRIVATE_S3_ENDPOINT,
  forcePathStyle: true,
  region: BUCKET_REGION,
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
})

const main = async () => {
  await s3.send(
    new PutBucketCorsCommand({
      Bucket: BUCKET_NAME,
      CORSConfiguration: {
        // Media is only read, so GET and HEAD are enough.
        CORSRules: [
          {
            AllowedOrigins: allowedOrigins,
            AllowedMethods: ["GET", "HEAD"],
            AllowedHeaders: ["*"],
            MaxAgeSeconds: 3600,
          },
        ],
      },
    })
  )
  console.log(
    `CORS policy applied on bucket "${BUCKET_NAME}" for origins: ${allowedOrigins.join(", ")}`
  )
}

main().catch((error) => {
  console.error("Failed to apply the CORS policy:", error)
  process.exit(1)
})
