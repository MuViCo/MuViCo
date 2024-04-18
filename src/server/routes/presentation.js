const express = require("express")
const multer = require("multer")
const crypto = require("crypto")
const { uploadFile, deleteFile, getObjectSignedUrl } = require("../utils/s3")
const Presentation = require("../models/presentation")
const { userExtractor } = require("../utils/middleware")

const logger = require("../utils/logger")
const { type } = require("os")

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
      presentation.files = await Promise.all(
        presentation.cues.map(async (cue) => {
          if (typeof cue.file.url === "string") {
            const key = `${id}/${cue.file.id.toString()}`
            cue.file.url = await getObjectSignedUrl(key)
          } else {
            cue.file.url = "/blank.png"
          }
          return cue
        })
      )
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
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params
    const fileId = generateFileId()
    const { file } = req

    if (!id || !req.body.index || !req.body.cueName || !req.body.screen) {
      return res.status(400).json({ error: "Missing required fields" })
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
              url:
                req.body.image === "/blank.png" ? null : "",
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

    res.json(updatedPresentation)

    return res.status(204).end()
  } catch (error) {
    logger.info("Error:", error)
    return res.status(500).json({ error: "Internal server error" })
  }
})

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
