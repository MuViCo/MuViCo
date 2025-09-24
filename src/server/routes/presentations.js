const express = require("express")
const { userExtractor } = require("../utils/middleware")
const Presentation = require("../models/presentation")

const router = express.Router()

/**
 * Retrieves presentations for a specific user.
 * @var {Middleware} userExtractor - Extracts user from request.
 */
router.get("/", userExtractor, async (req, res) => {
  const { user } = req
  if (user) {
    if (user.driveToken) {
      const presentations = await Presentation.find({
        user: user._id,
        storage: "googleDrive",
      })
      res.json(presentations.map((presentation) => presentation.toJSON()))
    } else {
      const presentations = await Presentation.find({
        user: user._id,
        storage: "aws",
      })
      res.json(presentations.map((presentation) => presentation.toJSON()))
    }
  } else {
    res.status(401).json({ error: "operation not permitted" })
  }
})

/**
 * Retrieves a specific presentation by ID for the user.
 */
router.get("/:id", userExtractor, async (req, res) => {
  const { id } = req.params
  const { user } = req

  if (!user) {
    return res.status(401).json({ error: "operation not permitted" })
  }

  try {
    const presentation = await Presentation.findOne({
      _id: id,
      user: user._id
    })

    if (!presentation) {
      return res.status(404).json({ error: "presentation not found" })
    }

    res.json(presentation.toJSON())
  } catch (error) {
    res.status(400).json({ error: "invalid presentation id" })
  }
})

/**
 * Creates a new presentation for the user
 */
router.post("/", userExtractor, async (req, res) => {
  const { name, screenCount} = req.body
  const { user } = req

  if (!user || !name) {
    return res.status(401).json({ error: "operation not permitted" })
  }

  const presentation = new Presentation({
    name,
    screenCount
  })

  if (user.driveToken) {
    presentation.storage = "googleDrive"
  }

  presentation.user = user._id

  const createdPresentation = await presentation.save()

  user.presentations = user.presentations.concat(createdPresentation._id)
  await user.save()

  return res.status(201).json(createdPresentation.toJSON())
})

module.exports = router
