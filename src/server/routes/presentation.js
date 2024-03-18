const express = require("express")
const multer = require("multer")
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3")
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner")
const Presentation = require("../models/presentation")
const { userExtractor } = require("../utils/middleware")

const {
  BUCKET_REGION,
  BUCKET_NAME,
  ACCESS_KEY,
  SECRET_ACCESS_KEY,
} = require("../utils/config")
const logger = require("../utils/logger")

const router = express.Router()

const storage = multer.memoryStorage()
const upload = multer({ storage })

const s3 = new S3Client({
  region: BUCKET_REGION,
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
})

/**
 * Returns all files related to a presentation.
 * Adds an expiring signed url to AWS Bucket for each file.
 */
router.get("/:id", userExtractor, async (req, res) => {
  const { user } = req
  if (!user) {
    return res.status(401).json({ error: "operation not permitted" })
  }
  const presentation = await Presentation.findById(req.params.id)
  if (
    presentation &&
    (presentation.user.toString() === user._id.toString() || user.isAdmin)
  ) {
    presentation.files = await Promise.all(
      presentation.files.map(async (file) => {
        const params = {
          Bucket: BUCKET_NAME,
          Key: file._id.toString(),
        }

        const command = new GetObjectCommand(params)
        const seconds = 60 * 60
        file.url = await getSignedUrl(s3, command, { expiresIn: seconds })
        return file
      })
    )
    res.json(presentation)
  } else {
    res.status(404).end()
  }
  return null
})

router.delete("/:id", async (req, res) => {
  await Presentation.findByIdAndDelete(req.params.id)
  res.status(204).end()
})

/**
 * Updates presentation by ID, uploading new files to presentation and adding them to mongoDB
 * and aws bucket. Can upload any kind of image or pdf.
 * @var {Middleware} upload.single - Exports the image from requests and adds it on multer cache
 */
router.put("/:id", upload.single("image"), async (req, res) => {
  const updatedPresentation = await Presentation.findByIdAndUpdate(
    req.params.id,
    {
      $push: {
        files: {
          name: req.body.name,
          url: "",
        },
        cues: {
          index: req.body.index,
          name: req.body.cueName,
          screen: req.body.screen,
          fileName: req.body.fileName,
        },
      },
    },
    { new: true }
  )
  const { file } = req
  const fileId = updatedPresentation.files.map((f) => f._id.toString()).pop()

  const bucketParams = {
    Bucket: BUCKET_NAME,
    Key: fileId,
    Body: file.buffer,
    ContentType: file.mimetype,
  }

  const command = new PutObjectCommand(bucketParams)
  await s3.send(command)

  res.json(updatedPresentation)

  res.status(204).end()
})

/**
 * Update the presentation by removing a file from the files array.
 */
router.delete("/:id/:fileId", async (req, res) => {
  const { id, fileId } = req.params
  const updatedPresentation = await Presentation.findByIdAndUpdate(
    id,
    {
      $pull: {
        files: {
          _id: fileId,
        },
      },
    },
    { new: true }
  )

  const deleteParams = {
    Bucket: BUCKET_NAME,
    Key: fileId,
  }

  const command = new DeleteObjectCommand(deleteParams)
  await s3.send(command)

  res.json(updatedPresentation)
  res.status(204).end()
})

module.exports = router
