import express from "express"

import User from "../models/user"
import Presentation from "../models/presentation"
import { userExtractor } from "../utils/middleware"

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
    if (!user) {
      return res.status(404).json({ error: "user not found" })
    }
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

export = router
