const express = require("express")
const multer = require("multer")
const crypto = require("crypto")
const { uploadFileS3, deleteFileS3 } = require("../utils/s3")
const { uploadDriveFile, deleteDriveFile } = require("../utils/drive")
const Presentation = require("../models/presentation")
const { userExtractor } = require("../utils/middleware")
const { BUCKET_NAME } = require("../utils/config")
const {
  generateSignedUrlForS3,
  processS3Files,
  processDriveCueFiles,
} = require("../utils/helper")
const logger = require("../utils/logger")
const router = express.Router()

const storage = multer.memoryStorage()
const upload = multer({ storage })

const generateFileId = () => crypto.randomBytes(8).toString("hex")

const deletObject = async (id, cueId, driveToken) => {
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

  if (driveToken) {
    const driveFileId = cue.cues[0].file.driveId
    if (driveFileId) {
      const presentation = await Presentation.findById(id)

      const sameFileCount = presentation.cues.filter(
        (c) => c.file.driveId === driveFileId
      ).length

      if (sameFileCount === 0) {
        await deleteDriveFile(driveFileId, driveToken)
      }
    }
  } else {
    const key = `${id}/${fileName}`
    await deleteFileS3(key)
  }

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
      if (user.driveToken) {
        const driveToken = user.driveToken
        presentation.cues = await processDriveCueFiles(
          presentation.cues,
          driveToken
        )
        res.json(presentation)
      } else {
        presentation.cues = await processS3Files(presentation.cues, id)
        res.json(presentation)
      }
    } else {
      res.status(404).end()
    }
    return null
  } catch (error) {
    logger.info("Error: ", error)
    return res.status(500).json({ error: "Internal server error" })
  }
})

router.delete("/:id", userExtractor, async (req, res) => {
  try {
    const { id } = req.params
    const { user } = req

    const presentation = await Presentation.findById(id)

    for (const cue of presentation.cues) {
      await deletObject(id, cue._id, user.driveToken)
    }

    await Presentation.findByIdAndDelete(id)
    return res.status(204).end()
  } catch (error) {
    logger.info("Error:", error)
    return res.status(500).json({ error: "Internal server error" }).end()
  }
})

/**
 * Updates presentation by ID, setting the new index count and adding them to mongoDB
 */
router.put("/:id/indexCount", userExtractor, async (req, res) => {
  try {
    const { id } = req.params
    const { indexCount } = req.body

    if (typeof indexCount !== "number") {
      return res.status(400).json({ error: "indexCount must be a number" })
    }

    if (indexCount < 1 || indexCount > 100) {
      return res.status(400).json({ error: "indexCount must be between 1 and 100"})
    }

    const updated = await Presentation.findByIdAndUpdate(
      id,
      { indexCount },
      { new: true }
    )

    if (!updated) {
      return res.status(404).json({ error: "Presentation not found" })
    }

    res.json({ indexCount: updated.indexCount })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Internal server error" })
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
    const { cueName, image, driveId } = req.body
    const index = Number(req.body.index)
    const screen = Number(req.body.screen)
    const loop = req.body.loop

    if (!id || isNaN(index) || !cueName || isNaN(screen)) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    // Get presentation to check screenCount for dynamic validation
    const presentationForValidation = await Presentation.findById(id)
    if (!presentationForValidation) {
      return res.status(404).json({ error: "Presentation not found" })
    }

    if (screen < 1 || screen > presentationForValidation.screenCount + 1) {
      return res.status(400).json({
        error: `Invalid cue screen: ${screen}. Screen must be between 1 and ${presentationForValidation.screenCount + 1}.`,
      })
    }

    if (index < 0 || index > 100) {
      return res.status(400).json({
        error: `Invalid cue index: ${index}. Index must be between 0 and 100.`,
      })
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
      const validAudioTypes = ["audio/mpeg", "audio/wav"]

      let fileType = ""
      if (file.mimetype.startsWith("image/")) {
        fileType = "image"
      } else if (file.mimetype.startsWith("video/")) {
        fileType = "video"
      } else if (file.mimetype.startsWith("audio/")) {
        fileType = "audio"
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
        case "audio":
          if (!validAudioTypes.includes(file.mimetype)) {
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

    const isAudioScreen = screen === presentationForValidation.screenCount + 1
    
    if (isAudioScreen) {
      if (image === "/blank.png") {
        return res.status(400).json({ 
          error: "Blank elements are not allowed on the audio screen. Please upload an audio file." 
        })
      }
      if (file && !file.mimetype.startsWith("audio/")) {
        return res.status(400).json({ 
          error: "Only audio files are allowed on the audio screen." 
        })
      }
    } else {
      if (file && file.mimetype.startsWith("audio/")) {
        return res.status(400).json({ 
          error: "Audio files are not allowed on visual screens. Please use the audio screen." 
        })
      }
    }

    const updatedPresentation = await Presentation.findByIdAndUpdate(
      id,
      {
        $push: {
          cues: {
            index: index,
            name: cueName,
            screen: screen,
            file: {
              id: fileId,
              name: file && file.originalname ? file.originalname : "blank.png",
              url: image === "/blank.png" ? null : "",
              ...(driveId && { driveId }),
            },
            loop: loop,
          },
        },
      },
      { new: true }
    )

    if (user.driveToken) {
      if (file) {
        if (driveId) {
          updatedPresentation.cues = updatedPresentation.cues.map((cue) => {
            if (cue.file.id === fileId) {
              cue.file.driveId = driveId
            }
            return cue
          })
        } else {
          const fileName = `${id}/${fileId}`
          const driveToken = user.driveToken
          const driveResponse = await uploadDriveFile(
            file.buffer,
            fileName,
            file.mimetype,
            driveToken
          )

          updatedPresentation.cues = updatedPresentation.cues.map((cue) => {
            if (cue.file.id === fileId) {
              cue.file.driveId = driveResponse.id
            }
            return cue
          })
        }
      }

      const driveToken = user.driveToken
      updatedPresentation.cues = await processDriveCueFiles(
        updatedPresentation.cues,
        driveToken
      )

      await updatedPresentation.save()
      res.json(updatedPresentation)
    } else {
      if (file) {
        const fileName = `${id}/${fileId}`

        await uploadFileS3(file.buffer, fileName, file.mimetype)
      }

      updatedPresentation.cues = await processS3Files(
        updatedPresentation.cues,
        id
      )
      res.json(updatedPresentation)
    }
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
      const { file, user } = req
      const { cueName, image } = req.body
      const index = Number(req.body.index)
      const screen = Number(req.body.screen)
      const loop = req.body.loop

      if (!id || isNaN(index) || !cueName || isNaN(screen)) {
        return res.status(400).json({ error: "Missing required fields" })
      }

      // Get presentation to check screenCount for dynamic validation
      const presentationData = await Presentation.findById(id)
      if (!presentationData) {
        return res.status(404).json({ error: "Presentation not found" })
      }

      if (screen < 1 || screen > presentationData.screenCount + 1) {
        return res.status(400).json({
          error: `Invalid cue screen: ${screen}. Screen must be between 1 and ${presentationData.screenCount + 1}.`,
        })
      }

      if (index < 0 || index > 100) {
        return res.status(400).json({
          error: `Invalid cue index: ${index}. Index must be between 0 and 100.`,
        })
      }

      const isAudioScreen = screen === presentationData.screenCount + 1
      
      if (isAudioScreen) {
        if (image === "/blank.png") {
          return res.status(400).json({ 
            error: "Blank elements are not allowed on the audio screen. Please upload an audio file." 
          })
        }
        if (file && !file.mimetype.startsWith("audio/")) {
          return res.status(400).json({ 
            error: "Only audio files are allowed on the audio screen." 
          })
        }
      } else {
        if (file && file.mimetype.startsWith("audio/")) {
          return res.status(400).json({ 
            error: "Audio files are not allowed on visual screens. Please use the audio screen." 
          })
        }
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
      cue.loop = loop

      if (image === "/blank.png") {
        const newFileId = generateFileId()
        cue.file = {
          id: newFileId,
          name: "blank.png",
          url: null,
          type: "image/png",
        }
      }

      if (user.driveToken) {
        if (file) {
          const newFileId = generateFileId()

          if (cue.file && cue.file.url) {
            const driveToken = user.driveToken
            if (cue.file.driveId) {
              const presentation = await Presentation.findById(id)

              const sameFileCount = presentation.cues.filter(
                (c) => c.file.driveId === cue.file.driveId
              ).length

              if (sameFileCount === 0) {
                await deleteDriveFile(cue.file.driveId, driveToken)
              }
            }
          }
          try {
            const fileName = `${id}/${newFileId}`
            const driveToken = user.driveToken
            const driveResponse = await uploadDriveFile(
              file.buffer,
              fileName,
              file.mimetype,
              driveToken
            )

            cue.file.driveId = driveResponse.id
          } catch (error) {
            console.error("File upload error:", error)
            return res.status(500).json({ error: "File upload failed" })
          }
        }
        await presentation.save()

        const driveToken = user.driveToken
        const updatedCue = await processDriveCueFiles([cue], driveToken)
        res.json(updatedCue[0])
      } else {
        if (file) {
          const newFileId = generateFileId()

          if (cue.file && cue.file.url) {
            const oldFileName = cue.file.url.split("/").pop()
            await deleteFileS3(`${id}/${oldFileName}`)
          }
          try {
            const fileName = `${id}/${newFileId}`
            await uploadFileS3(file.buffer, fileName, file.mimetype)
            cue.file = {
              id: newFileId,
              name: file.originalname,
              url: `https://${BUCKET_NAME}.s3.amazonaws.com/${fileName}`,
            }
            await generateSignedUrlForS3(cue, id)
          } catch (error) {
            console.error("File upload error:", error)
            return res.status(500).json({ error: "File upload failed" })
          }
        }
        await presentation.save()

        const updatedCue = await processS3Files([cue], id)
        res.json(updatedCue[0])
      }
    } catch (error) {
      console.error("Error:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  }
)

/**
 * Update the presentation by removing a file from the files array.
 */
router.delete("/:id/:cueId", userExtractor, async (req, res) => {
  try {
    const { id, cueId } = req.params
    const { user } = req
    const updatedPresentation = await deletObject(id, cueId, user.driveToken)
    res.json(updatedPresentation)
    res.status(204).end()
  } catch (error) {
    logger.info("Error: ", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

module.exports = router
