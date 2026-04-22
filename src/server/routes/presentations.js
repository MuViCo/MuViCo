/**
 * This module defines the routes for managing presentations, including retrieving a list of presentations for a user, getting details of a specific presentation, creating new presentations, and updating existing ones.
 * It uses middleware to extract the user from the request and to check if the user has access to the requested presentation. 
 * The routes interact with the Presentation model to perform database operations and return JSON responses. 
 * Input validation is included to ensure that required fields are present and meet specified criteria.
 */

const express = require("express")
const { userExtractor, requirePresentationAccess } = require("../utils/middleware")
const Presentation = require("../models/presentation")

const router = express.Router()

// Retrieves a list of presentations for the authenticated user, sorted by last used date
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
    }).sort({ lastUsed: -1 })
    
    return res.json(presentations.map((presentation) => presentation.toJSON()))
  } catch (error) {
    next(error)
  }
})

// Retrieves details of a specific presentation by ID, ensuring the user has access to it
router.get("/:id", userExtractor, requirePresentationAccess, async (req, res) => {
  const { presentation } = req
  return res.json(presentation.toJSON())
})


// Creates a new presentation for the user
router.post("/", userExtractor, async (req, res, next) => {
  try {
    const { name, description, screenCount} = req.body
    const { user } = req

    if (!user) {
      return res.status(401).json({ error: "operation not permitted" })
    }

    if (typeof name !== "string") {
      return res.status(400).json({ error: "name is required and must be a string" })
    }

    const trimmedName = name.trim()
    if (trimmedName.length === 0 || trimmedName.length > 100) {
      return res.status(400).json({ error: "name must be between 1 and 100 characters long" })
    }

    if (description && typeof description !== "string") {
      return res.status(400).json({ error: "description must be a string" })
    }

    const trimmedDescription = description ? description.trim() : ""
    if (trimmedDescription.length > 500) {
      return res.status(400).json({ error: "description must be at most 500 characters long" })
    }

    const presentation = new Presentation({
      name: trimmedName,
      description: trimmedDescription,
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
// Updates the name and description of an existing presentation, ensuring the user has access to it
router.put("/:id", userExtractor, requirePresentationAccess, async (req, res, next) => {
  try {
    const { presentation } = req
    const { name, description } = req.body

    if (typeof name !== "string") {
      return res.status(400).json({ error: "name is required and must be a string" })
    }

    const trimmedName = name.trim()
    if (trimmedName.length === 0 || trimmedName.length > 100) {
      return res.status(400).json({ error: "name must be between 1 and 100 characters long" })
    }

    if (description !== undefined && typeof description !== "string") {
      return res.status(400).json({ error: "description must be a string" })
    }

    const trimmedDescription = typeof description === "string" ? description.trim() : ""
    if (trimmedDescription.length > 500) {
      return res.status(400).json({ error: "description must be at most 500 characters long" })
    }

    presentation.name = trimmedName
    presentation.description = trimmedDescription
    const updatedPresentation = await presentation.save({ validateModifiedOnly: true })

    return res.json(updatedPresentation.toJSON())
  } catch (error) {
    next(error)
  }
})

module.exports = router
