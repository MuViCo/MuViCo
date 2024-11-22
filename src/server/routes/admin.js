const express = require("express")
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

router.get("/userspresentations/:id", userExtractor, async (req, res) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(401).json({ error: "operation not permitted" })
  }
  const presentations = await Presentation.find({ user: req.params.id })
  return res.json(presentations.map((presentation) => presentation.toJSON()))
})
module.exports = router
