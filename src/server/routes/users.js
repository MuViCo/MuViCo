const express = require("express")
const { userExtractor } = require("../utils/middleware")
const router = express.Router()
const User = require("../models/user")
const {
  minPwLength,
  maxPwLength,
  invalidPwCharRegex,
} = require("../../constants.js")
const {
  generateHash,
  checkPassword,
} = require("../utils/auth.js")

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

router.post("/change-password", userExtractor, async (req, res) => {
  const { currentPassword, newPassword } = req.body
  const { user } = req

  if (!user) {
    return res.status(401).json({ error: "User not found" })
  }

  if (typeof currentPassword !== "string" || currentPassword.length === 0) {
    return res.status(400).json({
      error: "Current password is required",
    })
  }

  if (typeof newPassword !== "string" || newPassword.length === 0) {
    return res.status(400).json({
      error: "New password is required",
    })
  }

  if (newPassword === currentPassword) {
    return res.status(400).json({
      error: "New password must be different from current password",
    })
  }

  if (newPassword.trim().length === 0) {
    return res.status(400).json({
      error: "Password cannot contain only spaces",
    })
  }

  if (newPassword.length < minPwLength) {
    return res.status(400).json({
      error: `Password must be at least ${minPwLength} characters long`,
    })
  }

  if (newPassword.length > maxPwLength) {
    return res.status(400).json({
      error: `Password must be at most ${maxPwLength} characters`,
    })
  }

  if (invalidPwCharRegex.test(newPassword)) {
    return res.status(400).json({
      error: "Password contains unsupported characters",
    })
  }

  if (!(await checkPassword(currentPassword, user.passwordHash))) {
    return res.status(401).json({
      error: "Current password is not valid",
    })
  }

  const newPasswordHash = await generateHash(newPassword)

  try {
    const updatedUser = await User.findByIdAndUpdate(
      user.id,
      { passwordHash: newPasswordHash },
      { new: true }
    )
    return res.status(201).json(updatedUser)
  } catch (error) {
    console.error("Password change failed:", error)
    res.status(400).json({ error: "Failed to change password" })
  }
})

module.exports = router
