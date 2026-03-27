const express = require("express")
const { generateHash } = require("../utils/auth.js")
const User = require("../models/user")
const {
  minPwLength,
  maxPwLength,
  minUnLength,
  maxUnLength,
  invalidPwCharRegex,
  unAllowedCharsRegex,
  unStartEndRegex,
  unConsecutiveSpecialsRegex,
} = require("../../constants.js")

const router = express.Router()

router.post("/", async (req, res) => {
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
  if (trimmedUsername.length < minUnLength) {
    return res.status(400).json({
      error: `username must be at least ${minUnLength} characters`,
    })
  }

  if (trimmedUsername.length > maxUnLength) {
    return res.status(400).json({
      error: `username can be at most ${maxUnLength} characters`,
    })
  }

  if (!unAllowedCharsRegex.test(trimmedUsername)) {
    return res.status(400).json({
      error:
        "username can only contain letters, numbers, dots, underscores, and hyphens",
    })
  }

  if (!unStartEndRegex.test(trimmedUsername)) {
    return res.status(400).json({
      error: "username must start and end with a letter or number",
    })
  }

  if (unConsecutiveSpecialsRegex.test(trimmedUsername)) {
    return res.status(400).json({
      error: "username cannot contain consecutive special characters",
    })
  }

  if (password.trim().length === 0) {
    return res.status(400).json({
      error: "password cannot contain only spaces",
    })
  }

  if (password.length < minPwLength) {
    return res.status(400).json({
      error: `password must be at least ${minPwLength} characters`,
    })
  }

  if (password.length > maxPwLength) {
    return res.status(400).json({
      error: `password must be at most ${maxPwLength} characters`,
    })
  }

  if (invalidPwCharRegex.test(password)) {
    return res.status(400).json({
      error: "password contains unsupported characters",
    })
  }

  const passwordHash = await generateHash(password)
  try {
    const user = new User({
      username: trimmedUsername,
      passwordHash,
    })

    const savedUser = await user.save({})

    return res.status(201).json(savedUser)
  } catch {
    return res.status(401).json({ error: "Username already exists" })
  }
})

module.exports = router
