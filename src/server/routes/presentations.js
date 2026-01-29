const express = require("express")
const { userExtractor, requirePresentationAccess } = require("../utils/middleware")
const Presentation = require("../models/presentation")

const router = express.Router()

/**
 * Retrieves presentations for a specific user.
 * @var {Middleware} userExtractor - Extracts user from request.
 */
router.get("/", userExtractor, async (req, res, next) => {
  try {
    const { user } = req

    if (!user) {
      return res.status(401).json({ error: "operation not permitted" })
    }

    const storageType = user.driveToken ? "googleDrive" : "aws"
    const presentations = await Presentation.find({
      user: user._id,
      storage: storageType
    })
    
    return res.json(presentations.map((presentation) => presentation.toJSON()))
  } catch (error) {
    next(error)
  }
})

/**
 * Retrieves a specific presentation by ID for the user.
 */
router.get("/:id", userExtractor, requirePresentationAccess, async (req, res) => {
  const { presentation } = req
  return res.json(presentation.toJSON())
})

/**
 * Creates a new presentation for the user
 */
router.post("/", userExtractor, async (req, res, next) => {
  try {
    const { name, screenCount} = req.body
    const { user } = req

    if (!user) {
      return res.status(401).json({ error: "operation not permitted" })
    }

    if (typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({ error: "name is required and must be a non-empty string" })
    }

    const presentation = new Presentation({
      name: name.trim(),
      screenCount,
      user: user._id,
      storage: user.driveToken ? "googleDrive" : "aws"
    })

    const createdPresentation = await presentation.save()

    user.presentations = user.presentations.concat(createdPresentation._id)
    await user.save()

    return res.status(201).json(createdPresentation.toJSON())
  } catch (error) {
    next(error)
  }
})

module.exports = router
