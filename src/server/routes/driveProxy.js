// driveProxy.js
const express = require("express")
const router = express.Router()
const { getDriveFileStream } = require("../utils/drive") // adjust the path as necessary

router.get("/:fileId", async (req, res) => {
  const { fileId } = req.params
  const accessToken = req.query.access_token // Or obtain this from a secure session
  if (!accessToken) {
    return res.status(401).send("Access token missing")
  }

  try {
    const fileStream = await getDriveFileStream(fileId, accessToken)
    // Optionally, set content type if you know it; otherwise, it might be derived from the stream.
    // You might also fetch metadata to get the content type.
    res.setHeader("Content-Type", "application/octet-stream")
    fileStream.pipe(res)
  } catch (error) {
    console.error("Error streaming file:", error)
    res.status(500).send("Error streaming file")
  }
})

module.exports = router
