const express = require("express")
const {
  userExtractor,
  requirePresentationAccess,
} = require("../utils/middleware")
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
      storage: storageType,
    }).sort({ lastUsed: -1 })

    return res.json(presentations.map((presentation) => presentation.toJSON()))
  } catch (error) {
    next(error)
  }
})

/**
 * Retrieves a specific presentation by ID for the user.
 */
router.get(
  "/:id",
  userExtractor,
  requirePresentationAccess,
  async (req, res) => {
    const { presentation } = req
    return res.json(presentation.toJSON())
  }
)

router.put(
  "/:id",
  userExtractor,
  requirePresentationAccess,
  async (req, res, next) => {
    try {
      const { presentation } = req
      const { name, description } = req.body

      if (typeof name !== "string") {
        return res
          .status(400)
          .json({ error: "name is required and must be a string" })
      }

      const trimmedName = name.trim()
      if (trimmedName.length === 0 || trimmedName.length > 100) {
        return res
          .status(400)
          .json({ error: "name must be between 1 and 100 characters long" })
      }

      if (description !== undefined && typeof description !== "string") {
        return res.status(400).json({ error: "description must be a string" })
      }

      const trimmedDescription =
        typeof description === "string" ? description.trim() : ""
      if (trimmedDescription.length > 500) {
        return res
          .status(400)
          .json({ error: "description must be at most 500 characters long" })
      }

      presentation.name = trimmedName
      presentation.description = trimmedDescription
      const updatedPresentation = await presentation.save({
        validateModifiedOnly: true,
      })

      return res.json(updatedPresentation.toJSON())
    } catch (error) {
      next(error)
    }
  }
)

module.exports = router
