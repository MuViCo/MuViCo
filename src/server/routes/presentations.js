const express = require("express")
const mongoose = require("mongoose")
const jwt = require("jsonwebtoken")
const { userExtractor } = require("../utils/middleware")
const User = require("../models/user")
const Presentation = require("../models/presentation")

const router = express.Router()

/**
 * Retrieves presentations for a specific user.
 * @var {Middleware} userExtractor - Extracts user from request.
 */
router.get("/", userExtractor, async (req, res) => {
  const user = req.user
  const presentations = await Presentation.find({ user: user._id })
  console.log("esitelmät: ", presentations)
  res.json(presentations.map((presentation) => presentation.toJSON()))
})

/**
 * Creates a new presentation for the user
 */
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

module.exports = router
