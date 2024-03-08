const express = require("express")
const Presentation = require("../models/presentation")
const multer = require("multer")
const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3")
const crypto = require("crypto")
require("dotenv").config()

const router = express.Router()

const randomImageName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex')

const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

let BUCKET_NAME = process.env.BUCKET_NAME
let BUCKET_REGION = process.env.BUCKET_REGION
let ACCESS_KEY = process.env.ACCESS_KEY
let SECRET_ACCESS_KEY = process.env.SECRET_ACCESS_KEY

const s3 = new S3Client({
  region: BUCKET_REGION,
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_ACCESS_KEY,
  }
})

router.get("/:id", async (req, res) => {
  const presentation = await Presentation.findById(req.params.id)
  if (presentation) {
    res.json(presentation)
  } else {
    res.status(404).end()
  }
})

router.delete("/:id", async (req, res) => {
  await Presentation.findByIdAndDelete(req.params.id)
  res.status(204).end()
})

router.put("/:id", upload.single('image'), async (req, res) => {
  const fileId = randomImageName()
  /*const bucketParams = {
    Bucket: BUCKET_NAME,
    Key: fileId,
    Body: req.body.buffer,
    ContentType: req.body.mimetype,
  }

  const command = new PutObjectCommand(bucketParams)

  await s3.send(command)*/

  const updatedPresentation = await Presentation.findByIdAndUpdate(
    req.params.id,
    { $push: { files: { name: req.body.name, url: fileId } } },
    { new: true }
  )

  res.json(updatedPresentation)

  res.status(204).end()
})

router.delete("/:id/:fileId", async (req, res) => {
  const { id, fileId } = req.params
  const updatedPresentation = await Presentation.findByIdAndUpdate(
    id,
    { $pull: { files: { _id: fileId } } },
    { new: true }
  )
  res.json(updatedPresentation)
  res.status(204).end()
})

module.exports = router
