/**
 * This module defines the routes for user signup, including checking username availability and creating new user accounts.
 * It includes input validation for usernames and passwords, ensuring that usernames meet specified criteria and that passwords are strong enough. 
 * The routes interact with the User model to perform database operations and return JSON responses. 
 * Error handling is included to manage invalid input and other issues that may arise during the signup process.
 */

const express = require("express")
const { validatePassword, generateHash } = require("../utils/auth.js")
const User = require("../models/user")
const {
  minUsernameLength,
  maxUsernameLength,
  usernameAllowedCharsRegex,
  usernameStartEndRegex,
  usernameConsecutiveSpecialsRegex,
} = require("../../constants.js")

const router = express.Router()

router.get("/check-username", async (req, res, next) => {
  const { username } = req.query

  if (typeof username !== "string" || username.trim().length === 0) {
    return res.status(400).json({
      error: "username query parameter is required",
    })
  }

  try {
    const trimmedUsername = username.trim()
    const existingUser = await User.findOne({ username: trimmedUsername })
    return res.status(200).json({ available: !existingUser })
  } catch (error) {
    return next(error)
  }
})

router.post("/", async (req, res, next) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({
      error: "username and password are required",
    })
  }

  if (typeof username !== "string" || typeof password !== "string") {
    return res.status(400).json({
      error: "username and password must be strings",
    })
  }
  

  const trimmedUsername = username.trim()

    if (trimmedUsername.length < minUsernameLength) {
    return res.status(400).json({
      error: `username must be at least ${minUsernameLength} characters`,
    })
  }

  if (trimmedUsername.length > maxUsernameLength) {
    return res.status(400).json({
      error: `username can be at most ${maxUsernameLength} characters`,
    })
  }

  if (!usernameAllowedCharsRegex.test(trimmedUsername)) {
    return res.status(400).json({
      error:
        "username can only contain letters, numbers, dots, underscores, and hyphens",
    })
  }

  if (!usernameStartEndRegex.test(trimmedUsername)) {
    return res.status(400).json({
      error: "username must start and end with a letter or number",
    })
  }

  if (usernameConsecutiveSpecialsRegex.test(trimmedUsername)) {
    return res.status(400).json({
      error: "username cannot contain consecutive special characters",
    })
  }

  try {
    validatePassword(password)
    
    const passwordHash = await generateHash(password)

    const user = new User({
      username: trimmedUsername,
      passwordHash,
    })

    const savedUser = await user.save({})

    return res.status(201).json(savedUser)
  } catch (error) {
    return next(error)
  }
})

module.exports = router
