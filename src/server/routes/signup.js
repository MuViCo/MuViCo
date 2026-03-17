const express = require("express")
const { validatePassword, generateHash } = require("../utils/auth.js")
const User = require("../models/user")
const { minPwLength, maxPwLength } = require("../../constants.js")

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
  if (trimmedUsername.length < 3) {
    return res.status(400).json({
      error:
        "username must be at least 3 characters long and not just whitespace",
    })
  }

  if (!validatePassword(password)) {
    return res.status(400).json({
      error: `password must be at least ${minPwLength} characters long`,
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
