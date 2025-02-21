const express = require("express")
const multer = require("multer")
const crypto = require("crypto")
const { type } = require("os")
const { uploadFile, deleteFile } = require("../utils/s3")
const Presentation = require("../models/presentation")
const { userExtractor } = require("../utils/middleware")
const { BUCKET_NAME } = require("../utils/config")
const { generateSignedUrlForCue } = require("../utils/helper")
const logger = require("../utils/logger")
const { processCueFiles } = require("../utils/helper")
const router = express.Router()

const storage = multer.memoryStorage()
const upload = multer({ storage })

const generateFileId = () => crypto.randomBytes(8).toString("hex")

const deletObject = async (id, cueId) => {
  const cue = await Presentation.findOne(
    { _id: id, "cues._id": cueId },
    { "cues.$": 1 }
  )
  const updatedPresentation = await Presentation.findByIdAndUpdate(
    id,
    {
      $pull: {
        cues: {
          _id: cueId,
        },
      },
    },
    { new: true }
  )

  const fileName = cue.cues[0].file.id
  const key = `${id}/${fileName}`

  await deleteFile(key)

  return updatedPresentation
}

/**
 * Returns all files related to a presentation.
 * Adds an expiring signed url to AWS Bucket for each file.
 */
router.get("/:id", userExtractor, async (req, res) => {
  try {
    const { user } = req
    const { id } = req.params
    if (!user) {
      return res.status(401).json({ error: "operation not permitted" })
    }
    const presentation = await Presentation.findById(req.params.id)
    if (
      presentation &&
      (presentation.user.toString() === user._id.toString() || user.isAdmin)
    ) {
      // processCueFiles parces cues and gets them their file size and type
      presentation.cues = await processCueFiles(presentation.cues, id)
      res.json(presentation)
    } else {
      res.status(404).end()
    }
    return null
  } catch (error) {
    logger.info("Error: ", error)
    return res.status(500).json({ error: "Internal server error" })
  }
})

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params

    const presentation = await Presentation.findById(id)

    // eslint-disable-next-line no-restricted-syntax
    for (const cue of presentation.cues) {
      // eslint-disable-next-line no-await-in-loop
      await deletObject(id, cue._id)
    }

    await Presentation.findByIdAndDelete(id)
    return res.status(204).end()
  } catch (error) {
    logger.info("Error:", error)
    return res.status(500).json({ error: "Internal server error" }).end()
  }
})

/**
 * Updates presentation by ID, uploading new files to presentation and adding them to mongoDB
 * and aws bucket. Can upload any kind of image or pdf.
 * @var {Middleware} upload.single - Exports the image from requests and adds it on multer cache
 */
router.put("/:id", userExtractor, upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params
    const fileId = generateFileId()
    const { file, user } = req
    if (!id || !req.body.index || !req.body.cueName || !req.body.screen) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    if (req.body.screen < 1 || req.body.screen > 4) {
      return res
        .status(400)
        .json({ error: "Screen number must be between 1 and 4." })
    }

    if (file && file.size > 50 * 1024 * 1024 && !user.isAdmin) {
      return res.status(400).json({ error: "File size exceeds 50 MB limit" })
    }

    if (file) {
      const validVideoTypes = ["video/mp4", "video/3gpp"]
      const validImageTypes = [
        "image/jpeg",
        "image/gif",
        "image/apng",
        "image/bmp",
        "image/png",
        "image/svg+xml",
        "image/webp",
        "image/vnd.microsoft.icon",
        "image/avif",
        "image/x-win-bitmap",
      ]

      let fileType = ""
      if (file.mimetype.startsWith("image/")) {
        fileType = "image"
      } else if (file.mimetype.startsWith("video/")) {
        fileType = "video"
      }

      switch (fileType) {
        case "image":
          if (!validImageTypes.includes(file.mimetype)) {
            return res
              .status(400)
              .json({ error: `Invalid filetype: ${file.originalname}` })
          } else {
            break
          }
        case "video":
          if (!validVideoTypes.includes(file.mimetype)) {
            return res
              .status(400)
              .json({ error: `Invalid filetype: ${file.originalname}` })
          } else {
            break
          }
        default:
          return res
            .status(400)
            .json({ error: `Invalid filetype: ${file.originalname}` })
      }
    }

    const updatedPresentation = await Presentation.findByIdAndUpdate(
      id,
      {
        $push: {
          cues: {
            index: req.body.index,
            name: req.body.cueName,
            screen: req.body.screen,
            file: {
              id: fileId,
              name: req.body.fileName,
              url: req.body.image === "/blank.png" ? null : "",
            },
          },
        },
      },
      { new: true }
    )

    if (file) {
      const fileName = `${id}/${fileId}`

      await uploadFile(file.buffer, fileName, file.mimetype)
    }

    updatedPresentation.cues = await processCueFiles(
      updatedPresentation.cues,
      id
    )
    res.json(updatedPresentation)
    return res.status(204).end()
  } catch (error) {
    logger.info("Error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
})

router.put(
  "/:id/:cueId",
  userExtractor,
  upload.single("image"),
  async (req, res) => {
    try {
      const { id, cueId } = req.params
      const { file } = req
      const { index, screen, cueName, image } = req.body

      if (!id || !index || !screen || !cueId || !cueName) {
        return res.status(400).json({ error: "Missing required fields" })
      }

      if (screen < 1 || screen > 4) {
        return res
          .status(400)
          .json({ error: "Screen number must be between 1 and 4." })
      }

      const presentation = await Presentation.findById(id)
      if (!presentation) {
        return res.status(404).json({ error: "Presentation not found" })
      }

      const cue = presentation.cues.id(cueId)
      if (!cue) {
        return res.status(404).json({ error: "Cue not found" })
      }
      // Update cue fields
      cue.index = index
      cue.screen = screen
      cue.name = cueName

      if (image === "/blank.png") {
        const newFileId = generateFileId()
        cue.file = {
          id: newFileId,
          name: "blank.png",
          url: null,
          type: "image/png",
        }
      }

      if (file) {
        const newFileId = generateFileId()

        if (cue.file && cue.file.url) {
          const oldFileName = cue.file.url.split("/").pop()
          await deleteFile(`${id}/${oldFileName}`)
        }
        try {
          const fileName = `${id}/${newFileId}`
          await uploadFile(file.buffer, fileName, file.mimetype)
          cue.file = {
            id: newFileId,
            name: file.originalname,
            url: `https://${BUCKET_NAME}.s3.amazonaws.com/${fileName}`,
          }
          await generateSignedUrlForCue(cue, id)
        } catch (error) {
          console.error("File upload error:", error)
          return res.status(500).json({ error: "File upload failed" })
        }
      }
      await presentation.save()

      const updatedCue = await processCueFiles([cue], id)
      res.json(updatedCue[0])
    } catch (error) {
      console.error("Error:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  }
)

/**
 * Update the presentation by removing a file from the files array.
 */
router.delete("/:id/:cueId", async (req, res) => {
  try {
    const { id, cueId } = req.params
    const updatedPresentation = await deletObject(id, cueId)
    res.json(updatedPresentation)
    res.status(204).end()
  } catch (error) {
    logger.info("Error: ", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

module.exports = router
