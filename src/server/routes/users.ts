/**
 * This module defines the routes for user-related operations, including linking and unlinking Google Drive accounts and changing user passwords.
 * It uses middleware to extract the user from the request and to ensure that the user is authenticated before performing any operations.
 * The routes interact with the User model to perform database operations and return JSON responses.
 * Input validation is included to ensure that required fields are present and meet specified criteria, such as password strength requirements.
 */
import express from "express"

import { userExtractor } from "../utils/middleware"
import User from "../models/user"
import {
  minPwLength,
  maxPwLength,
  invalidPwCharRegex,
} from "../../constants.js"
import { generateHash, checkPassword } from "../utils/auth"
import * as logger from "../utils/logger"

const router = express.Router()

router.post("/link-drive", userExtractor, async (req, res) => {
  try {
    const { driveAccessToken } = req.body
    const { user } = req

    if (!user) {
      return res.status(401).json({ error: "authentication required" })
    }

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
    logger.error("Error linking Drive:", error)
    res.status(500).json({ error: "Failed to link Google Drive" })
  }
})

router.post("/unlink-drive", userExtractor, async (req, res) => {
  try {
    const { user } = req

    if (!user) {
      return res.status(401).json({ error: "authentication required" })
    }

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
    logger.error("Error unlinking Drive:", error)
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

  // passwordHash can be undefined for a Firebase-only account -- would
  // already fail here at runtime the same way before this migration
  if (!(await checkPassword(currentPassword, user.passwordHash as string))) {
    return res.status(400).json({
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
    logger.error("Password change failed:", error)
    res.status(400).json({ error: "Failed to change password" })
  }
})

export = router
