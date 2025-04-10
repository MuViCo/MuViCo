const express = require("express")
const router = express.Router()
const { getDriveFileStream, getDriveFileMetadata } = require("../utils/drive")

router.get("/:fileId", async (req, res) => {
  const { fileId } = req.params
  const accessToken = req.query.access_token
  if (!accessToken) {
    return res.status(401).send("Access token missing")
  }

  try {
    const metadata = await getDriveFileMetadata(fileId, accessToken)
    const mimeType = metadata.mimeType

    const fileStream = await getDriveFileStream(fileId, accessToken)
    res.setHeader("Content-Type", mimeType)
    fileStream.pipe(res)
  } catch (error) {
    console.error("Error streaming file:", error)
    res.status(500).send("Error streaming file")
  }
})

module.exports = router
