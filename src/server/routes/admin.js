const express = require("express")
const bcrypt = require("bcrypt")
const User = require("../models/user")
const Presentation = require("../models/presentation")
const { userExtractor } = require("../utils/middleware")

const router = express.Router()

router.get("/", userExtractor, async (req, res) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(401).json({ error: "operation not permitted" })
  }
  const users = await User.find({})
  return res.send(users.map((u) => u.toJSON()))
})

router.delete("/user/:id", userExtractor, async (req, res) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(401).json({ error: "operation not permitted" })
  }
  await User.findByIdAndDelete(req.params.id)
  return res.status(204).end()
})

router.put("/makeadmin/:id", userExtractor, async (req, res) => {
  if (req.user && req.user.isAdmin) {
    const user = await User.findById(req.params.id)
    user.isAdmin = true
    await user.save()
    return res.status(200).json(user.toJSON())
  }
  return res.status(401).json({ error: "operation not permitted" })
})

router.post("/create/", async (req, res) => {
  const { username, password } = req.body
  const isAdmin = true
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

router.get("/userspresentations/:id", userExtractor, async (req, res) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(401).json({ error: "operation not permitted" })
  }
  const presentations = await Presentation.find({ user: req.params.id })
  res.json(presentations.map((presentation) => presentation.toJSON()))
})
module.exports = router
