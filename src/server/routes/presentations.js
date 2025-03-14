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
    const presentations = await Presentation.find({ user: user._id })
    res.json(presentations.map((presentation) => presentation.toJSON()))
  } else {
    res.status(401).json({ error: "operation not permitted" })
  }
})

/**
 * Creates a new presentation for the user
 */
router.post("/", userExtractor, async (req, res) => {
  const { name } = req.body
  const { user } = req

  if (!user || !name) {
    return res.status(401).json({ error: "operation not permitted" })
  }

  const presentation = new Presentation({
    name,
  })

  presentation.user = user._id

  const createdPresentation = await presentation.save()

  user.presentations = user.presentations.concat(createdPresentation._id)
  await user.save()

  return res.status(201).json()
})

module.exports = router
