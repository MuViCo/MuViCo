const express = require("express")
const bcrypt = require("bcrypt")
const User = require("../models/user")

const router = express.Router()

router.post("/", async (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({
      error: "username and password are required"
    })
  }

  if (typeof username !== "string" || typeof password !== "string") {
    return res.status(400).json({
      error: "username and password must be strings"
    })
  }

  const trimmedUsername = username.trim()
  if (trimmedUsername.length < 3) {
    return res.status(400).json({
      error: "username must be at least 3 characters long and not just whitespace"
    })
  }

  const trimmedPassword = password.trim()
  if (trimmedPassword.length < 3) {
    return res.status(400).json({
      error: "password must be at least 3 characters long and not just whitespace"
    })
  }

  try {
    const saltRounds = 10 // Number of rounds to use when hashing the password
    const passwordHash = await bcrypt.hash(trimmedPassword, saltRounds)
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
