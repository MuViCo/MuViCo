const express = require("express")
const { userExtractor } = require("../utils/middleware")
const Presentation = require("../models/presentation")

const router = express.Router()

router.get("/", userExtractor, async (req, res) => {
  const user = req.user
  if (user.isAdmin) {
    const presentations = await Presentation.find()
    res.json(presentations.map((presentation) => presentation.toJSON()))
  } else {
    const presentations = await Presentation.find({ user: user._id })
    res.json(presentations.map((presentation) => presentation.toJSON()))
  }
})

router.post("/", userExtractor, async (req, res) => {
  const { name } = req.body

  const user = req.user

  if (!user) {
    return res.status(401).json({ error: "operation not permitted" })
  }

  const presentation = new Presentation({
    name,
  })

  presentation.user = user._id

  const createdPresentation = await presentation.save()

  user.presentations = user.presentations.concat(createdPresentation._id)
  await user.save()

  res.status(201).json()
})

router.get("/:id", async (req, res) => {
  const presentation = await Presentation.findById(req.params.id)
  if (presentation) {
    res.json(presentation)
  } else {
    res.status(404).end()
  }
})

module.exports = router
