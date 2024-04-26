const express = require("express")
const bcrypt = require("bcrypt")
const User = require("../models/user")

const router = express.Router()

router.post("/", async (req, res) => {
  const { username, password } = req.body
  const isAdmin = username === "Klemstro"
  try {
    const saltRounds = 10 // Number of rounds to use when hashing the password
    const passwordHash = await bcrypt.hash(password, saltRounds)
    const user = new User({
      username,
      passwordHash,
      isAdmin,
    })

    const savedUser = await user.save({})

    return res.status(201).json(savedUser)
  } catch {
    return res.status(401).json({ error: "Username already exists" })
  }
})

module.exports = router
