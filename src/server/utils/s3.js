const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand
} = require("@aws-sdk/client-s3")
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner")

const {
  BUCKET_REGION,
  BUCKET_NAME,
  ACCESS_KEY,
  SECRET_ACCESS_KEY,
} = require("./config")

// Default S3 client (MuViCo credentials)
const defaultS3Client = new S3Client({
  region: BUCKET_REGION,
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
})

// Function to assume role for user-specific AWS credentials
async function assumeRoleForUser(iamRoleArn) {
  const stsClient = new STSClient({ region: BUCKET_REGION })
  const params = {
    RoleArn: iamRoleArn,
    RoleSessionName: "MuViCo-Session", // has to be modified
  }

  try {
    const data = await stsClient.send(new AssumeRoleCommand(params))
    const credentials = data.Credentials
    return new S3Client({
      region: BUCKET_REGION,
      credentials: {
        accessKeyId: credentials.AccessKeyId,
        secretAccessKey: credentials.SecretAccessKey,
        sessionToken: credentials.SessionToken,
      },
    })
  } catch (error) {
    console.error("Error assuming role:", error)
    throw error
  }
}

async function getS3Client(userIAMRoleArn) {
  console.log("user IAM Role Arn:", userIAMRoleArn)
  if (userIAMRoleArn) {
    return assumeRoleForUser(userIAMRoleArn)
  }
  return defaultS3Client
}

const uploadFile = async (fileBuffer, fileName, mimetype, userIAMRoleArn) => {
  const s3 = await getS3Client(userIAMRoleArn)
  const uploadParams = {
    Bucket: BUCKET_NAME,
    Body: fileBuffer,
    Key: fileName,
    ContentType: mimetype,
  }
  return s3.send(new PutObjectCommand(uploadParams))
}

const deleteFile = async (fileName, userIAMRoleArn) => {
  const s3 = await getS3Client(userIAMRoleArn)
  const deleteParams = {
    Bucket: BUCKET_NAME,
    Key: fileName,
  }
  return s3.send(new DeleteObjectCommand(deleteParams))
}

const getObjectSignedUrl = async (key, userIAMRoleArn) => {
  const s3 = await getS3Client(userIAMRoleArn)
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
  }

  // https://aws.amazon.com/blogs/developer/generate-presigned-url-modular-aws-sdk-javascript/
  const command = new GetObjectCommand(params)
  const seconds = 3 * 60 * 60
  const url = await getSignedUrl(s3, command, { expiresIn: seconds })
  return url
}

const getFileSize = async (cue, presentationId, userIAMRoleArn) => {
  const s3 = await getS3Client(userIAMRoleArn)
  const key = `${presentationId}/${cue.file.id.toString()}`
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
  }
  const command = new HeadObjectCommand(params)
  const url = await getSignedUrl(s3, command, { expiresIn: 3 * 60 * 60 })
  try {
    const response = await fetch(url, { method: "HEAD" })
    const contentLength = response.headers.get("Content-Length")
    if (contentLength) {
      cue.file.size = parseInt(contentLength, 10)
      return cue
    } else {
      throw new Error("Content-Length header is missing.")
    }
  } catch (error) {
    console.error("Error getting file size:", error)
    throw error
  }
}

const getFileType = async (cue, presentationId, userIAMRoleArn) => {
  const s3 = await getS3Client(userIAMRoleArn)
  const key = `${presentationId}/${cue.file.id.toString()}`
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
  }
  const command = new HeadObjectCommand(params)
  const url = await getSignedUrl(s3, command, { expiresIn: 3600 })

  try {
    const response = await fetch(url, { method: "HEAD" })
    const contentType = response.headers.get("Content-Type")
    if (contentType) {
      cue.file.type = contentType
      return cue
    } else {
      throw new Error("Content-Type header is missing.")
    }
  } catch (error) {
    console.error("Error getting file type:", error)
    throw error
  }
}

module.exports = { uploadFile, deleteFile, getObjectSignedUrl, getFileSize, getFileType }