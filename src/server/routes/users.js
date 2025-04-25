const express = require("express")
const { userExtractor } = require("../utils/middleware")
const router = express.Router()

router.post("/link-drive", userExtractor, async (req, res) => {
  try {
    const { driveAccessToken } = req.body
    const user = req.user

    user.driveToken = driveAccessToken
    await user.save()

    res.status(200).json({
      message: "Google Drive linked successfully",
      username: user.username,
      isAdmin: user.isAdmin,
      driveToken: user.driveToken,
      id: user.id,
    })
  } catch (error) {
    console.error("Error linking Drive:", error)
    res.status(500).json({ error: "Failed to link Google Drive" })
  }
})

router.post("/unlink-drive", userExtractor, async (req, res) => {
  try {
    const user = req.user

    user.driveToken = null
    await user.save()

    res.status(200).json({
      message: "Google Drive unlinked successfully",
      username: user.username,
      isAdmin: user.isAdmin,
      driveToken: user.driveToken,
      id: user.id,
    })
  } catch (error) {
    console.error("Error unlinking Drive:", error)
    res.status(500).json({ error: "Failed to link Google Drive" })
  }
})

module.exports = router
