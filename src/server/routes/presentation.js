const express = require("express")
const multer = require("multer")
const crypto = require("crypto")
const { uploadFileS3, deleteFileS3 } = require("../utils/s3")
const { uploadDriveFile, deleteDriveFile } = require("../utils/drive")
const Presentation = require("../models/presentation")
const { userExtractor, requirePresentationAccess } = require("../utils/middleware")
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
router.get("/:id", userExtractor, requirePresentationAccess, async (req, res, next) => {
  try {
    const { user, presentation } = req

    if (user.driveToken) {
      const driveToken = user.driveToken
      presentation.cues = await processDriveCueFiles(
        presentation.cues,
        driveToken
      )
    } else {
      presentation.cues = await processS3Files(presentation.cues, presentation._id)
    }

    res.json(presentation)
  } catch (error) {
    next(error)
  }
})

router.delete("/:id", userExtractor, requirePresentationAccess, async (req, res, next) => {
  try {
    const { user, presentation } = req

    for (const cue of presentation.cues) {
      await deletObject(presentation._id, cue._id, user.driveToken)
    }

    await Presentation.findByIdAndDelete(presentation._id)
    return res.status(204).end()
  } catch (error) {
    next(error)
  }
})

/**
 * Updates presentation by ID, setting the new index count and adding them to mongoDB
 */
router.put("/:id/indexCount", userExtractor, requirePresentationAccess, async (req, res, next) => {
  try {
    const { presentation } = req
    const { indexCount } = req.body
    
    const newIndexCount = Math.round(Number(indexCount))
    
    if (isNaN(newIndexCount)) {
      return res.status(400).json({ error: "indexCount must be a number" })
    }

    if (newIndexCount < 1 || newIndexCount > 100) {
      return res.status(400).json({ error: "indexCount must be between 1 and 100"})
    }
    

    const updateQuery = {
      $set: { indexCount: newIndexCount }
    }

    // If reducing index count, remove cues from indexes that will be removed
    let removedCuesCount = 0
    if (newIndexCount < presentation.indexCount) {
      const cuesToRemove = presentation.cues.filter(
        cue => cue.index >= newIndexCount && cue.index < presentation.indexCount
      )
      removedCuesCount = cuesToRemove.length

      updateQuery.$pull = {
        cues: {
          index: { $gte: newIndexCount }
        }
      }
    }

    const updatedPresentation = await Presentation.findByIdAndUpdate(
      presentation._id,
      updateQuery,
      { new: true }
    )

    res.json({
      indexCount: updatedPresentation.indexCount,
      removedCuesCount: removedCuesCount
    })
  } catch (err) {
    next(err)
  }
})

/**
 * Update presentation screenCount by ID
 */
router.put("/:id/screenCount", userExtractor, requirePresentationAccess, async (req, res, next) => {
  try {
    const { presentation } = req
    const { screenCount } = req.body

    const newScreenCount = Math.round(Number(screenCount))

    if (isNaN(newScreenCount)) {
      return res.status(400).json({ error: "screenCount must be a number" })
    }

    if (newScreenCount < 1 || newScreenCount > 8) {
      return res.status(400).json({ error: "screenCount must be between 1 and 8" })
    }

    const updateQuery = {
      $set: { screenCount: newScreenCount }
    }
    
    // If reducing screen count, remove cues from screens that will be removed
    let removedCuesCount = 0
    if (newScreenCount < presentation.screenCount) {
      const cuesToRemove = presentation.cues.filter(
        cue => cue.screen > newScreenCount && cue.screen <= presentation.screenCount
      )
      removedCuesCount = cuesToRemove.length

      // Remove cues from screens being deleted
      updateQuery.$pull = {
        cues: {
          screen: { $gt: newScreenCount }
        }
      }
    }
    
    const updated = await Presentation.findByIdAndUpdate(
      presentation._id,
      updateQuery,
      { new: true }
    )

    res.json({ 
      screenCount: updated.screenCount,
      removedCuesCount: removedCuesCount
    })
  } catch (err) {
    next(err)
  }
})

router.put("/:id/name", userExtractor, requirePresentationAccess, async (req, res, next) => {
  try {
    const { presentation } = req
    const { name } = req.body

    if (typeof name !== "string") {
      return res.status(400).json({ error: "Presentation name must be a string" })
    }
    
    const trimmedName = name.trim()
    if (trimmedName.length === 0 || trimmedName.length > 100) {
      return res.status(400).json({ error: "Presentation name must be between 1 and 100 characters long" })
    }

    presentation.name = trimmedName
    const updated = await presentation.save({validateModifiedOnly: true})

    res.json({ name: updated.name })
  } catch (err) {
    next(err)
  }
})

/**
 * Updates presentation by ID, uploading new files to presentation and adding them to mongoDB
 * and aws bucket. Can upload any kind of image or pdf.
 * @var {Middleware} upload.single - Exports the image from requests and adds it on multer cache
 */
router.put("/:id", userExtractor, requirePresentationAccess, upload.single("image"), async (req, res, next) => {
  try {
    const { id } = req.params
    const fileId = generateFileId()
    const { file, user, presentation } = req
    const { cueName, image, driveId } = req.body
    const index = Number(req.body.index)
    const screen = Number(req.body.screen)
    const loop = req.body.loop
    const color = req.body.color || "#9142ff"
    
    if (!id || isNaN(index) || !cueName || isNaN(screen)) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    if (typeof cueName !== "string") {
      return res.status(400).json({ error: "Cue name must be a string" })
    }

    const trimmedCueName = cueName.trim()
    if (trimmedCueName.length === 0 || trimmedCueName.length > 100) {
      return res.status(400).json({ error: "Cue name must be between 1 and 100 characters long" })
    }

    if (screen < 1 || screen > presentation.screenCount + 1) {
      return res.status(400).json({
        error: `Invalid cue screen: ${screen}. Screen must be between 1 and ${presentation.screenCount + 1}.`,
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

    const isAudioScreen = screen === presentation.screenCount + 1
    
    if (isAudioScreen) {
      if (image === "/blank.png" || image === "/blank-white.png" || image === "/blank-indigo.png" || image === "/blank-tropicalindigo.png") {
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
      presentation._id,
      {
        $push: {
          cues: {
            index: index,
            name: trimmedCueName,
            screen: screen,
            file: {
              id: fileId,
              name: file && file.originalname ? file.originalname : (image === "/blank-white.png" ? "blank-white.png" : image === "/blank-indigo.png" ? "blank-indigo.png" : image === "/blank-tropicalindigo.png" ? "blank-tropicalindigo.png" : "blank.png"),
              url: (image === "/blank.png" || image === "/blank-white.png" || image === "/blank-indigo.png" || image === "/blank-tropicalindigo.png") ? null : "",
              ...(driveId && { driveId }),
            },
            color: color,
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
    next(error)
  }
})

/**
 * Shift cue indices in bulk starting after startIndex.
 * body: { startIndex: number, direction: 'left'|'right' }
 */
router.put("/:id/shiftIndexes", userExtractor, requirePresentationAccess, async (req, res, next) => {
  try {
    const { presentation } = req
    const { startIndex, direction } = req.body

    if (typeof startIndex !== "number" || !["left", "right"].includes(direction)) {
      return res.status(400).json({ error: "Invalid parameters" })
    }

    let modified = false
    for (const cue of presentation.cues) {
      if (cue.index > startIndex) {
        if (direction === "left") {
          cue.index = Number(cue.index) - 1
          modified = true
        } else if (direction === "right") {
          cue.index = Number(cue.index) + 1
          modified = true
        }
      }
    }

    if (modified) {
      await presentation.save({validateModifiedOnly: true})
    }

    res.json({ shifted: modified })
  } catch (err) {
    next(err)
  }
})
router.put(
  "/:id/:cueId",
  userExtractor,
  requirePresentationAccess,
  upload.single("image"),
  async (req, res, next) => {
    try {
      const { id, cueId } = req.params
      const { file, user, presentation } = req
      const { cueName, image } = req.body
      const index = Number(req.body.index)
      const screen = Number(req.body.screen)
      const loop = req.body.loop
      // default fallback color is yellow, but it should never be used since color is a required field in the frontend
      const color = req.body.color || "#fded11"

      if (!id || isNaN(index) || isNaN(screen)) {
        return res.status(400).json({ error: "Missing required fields" })
      }

      if (typeof cueName !== "string") {
        return res.status(400).json({ error: "Cue name must be a string" })
      }

      const trimmedCueName = cueName.trim()
      if (trimmedCueName.length === 0 || trimmedCueName.length > 100) {
        return res.status(400).json({ error: "Cue name must be between 1 and 100 characters long" })
      }

      if (screen < 1 || screen > presentation.screenCount + 1) {
        return res.status(400).json({
          error: `Invalid cue screen: ${screen}. Screen must be between 1 and ${presentation.screenCount + 1}.`,
        })
      }

      if (index < 0 || index >= presentation.indexCount) {
        return res.status(400).json({
          error: `Invalid cue index: ${index}. Index must be between 0 and ${presentation.indexCount - 1}.`,
        })
      }

      const isAudioScreen = screen === presentation.screenCount + 1
      
      if (isAudioScreen) {
        if (image === "/blank.png" || image === "/blank-white.png" || image === "/blank-indigo.png" || image === "/blank-tropicalindigo.png") {
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

      const cue = presentation.cues.id(cueId)
      if (!cue) {
        return res.status(404).json({ error: "Cue not found" })
      }
      // Update cue fields
      cue.index = index
      cue.screen = screen
      cue.name = trimmedCueName
      cue.loop = loop
      cue.color = color

      
      if (image === "/blank.png" || image === "/blank-white.png" || image === "/blank-indigo.png" || image === "/blank-tropicalindigo.png") {
        const newFileId = generateFileId()
        cue.file = {
          id: newFileId,
          name: image === "/blank-white.png" ? "blank-white.png" : image === "/blank-indigo.png" ? "blank-indigo.png" : image === "/blank-tropicalindigo.png" ? "blank-tropicalindigo.png" : "blank.png",
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
        await presentation.save({validateModifiedOnly: true})

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
        await presentation.save({validateModifiedOnly: true})

        const updatedCue = await processS3Files([cue], id)
        res.json(updatedCue[0])
      }
    } catch (error) {
      next(error)
    }
  }
)

/**
 * Update the presentation by removing a file from the files array.
 */
router.delete("/:id/:cueId", userExtractor, requirePresentationAccess, async (req, res, next) => {
  try {
    const { cueId } = req.params
    const { user, presentation } = req
    const updatedPresentation = await deletObject(presentation._id, cueId, user.driveToken)
    res.json(updatedPresentation)
    res.status(204).end()
  } catch (error) {
    next(error)
  }
})

module.exports = router
