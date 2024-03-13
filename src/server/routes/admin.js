const express = require("express")
const User = require("../models/user")
const { userExtractor } = require("../utils/middleware")

const router = express.Router()

router.get("/", userExtractor, async (req, res) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(401).json({ error: "operation not permitted" })
  }
  const users = await User.find({})
  res.send(users.map((u) => u.toJSON()))
})

router.delete("/user/:id", userExtractor, async (req, res) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(401).json({ error: "operation not permitted" })
  }
  await User.findByIdAndDelete(req.params.id)
  res.status(204).end()
})

module.exports = router
