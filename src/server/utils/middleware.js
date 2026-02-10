const jwt = require("jsonwebtoken")
const User = require("../models/user")
const Presentation = require("../models/presentation")
const logger = require("./logger")

const requestLogger = (request, response, next) => {
  logger.info("Method:", request.method)
  logger.info("Path:  ", request.path)
  logger.info("Body:  ", request.body)
  logger.info("---")
  next()
}

/**
 * Extracts the token from the request headers.
 * @param {Object} request - The request object.
 * @returns {string|null} - The extracted token or null if not found.
 */
const getTokenFrom = (request) => {
  const auth = request.headers.authorization
  if (auth && auth.toLowerCase().startsWith("bearer ")) {
    request.token = auth.substring(7)
  }
  return null
}

/**
 * Extracts the user from the request token and attaches it to the request object.
 */
const userExtractor = async (request, response, next) => {
  try {
    getTokenFrom(request)
    const { token } = request
    if (token) {
      const decodedToken = jwt.verify(token, process.env.SECRET)
      if (!decodedToken.id) {
        return response.status(401).json({ error: "token invalid" })
      }

      request.user = await User.findById(decodedToken.id)
    }
    next() // Call next() only if no response has been sent
  } catch (error) {
    next(error)
  }
}

/**
 * Fetches presentation from the database and checks if the user is authorized to access it.
 */

const requirePresentationAccess = async (request, response, next) => {
  try {
    const { id } = request.params
    const { user } = request

    if (!user) {
      return response.status(401).json({ error: "authentication required" })
    }

    const presentation = await Presentation.findById(id)

    if (!presentation) {
      return response.status(404).json({ error: "presentation not found" })
    }

    const isOwner = presentation.user.toString() === user._id.toString()
    const isAdmin = user.isAdmin

    if (!isOwner && !isAdmin) {
      return response.status(403).json({ error: "access denied" })
    }

    request.presentation = presentation

    next()
  } catch (error) {
    next(error)
  }
}

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: "unknown endpoint" })
}

const errorHandler = (error, request, response, next) => {
  logger.error(error.message)

  if (error.name === "CastError") {
    return response.status(400).send({ error: "malformatted id" })
  }
  if (error.name === "ValidationError") {
    return response.status(400).json({ error: error.message })
  }
  if (error.name === "JsonWebTokenError") {
    return response.status(401).json({ error: "invalid token" })
  }
  if (error.name === "TokenExpiredError") {
    return response.status(401).json({ error: "token expired" })
  }
  if (error.name === "MongoServerError" && error.code === 11000) {
    return response.status(400).json({ error: "duplicate key error" })
  }

  next(error)

  return null
}

module.exports = {
  requestLogger,
  unknownEndpoint,
  errorHandler,
  userExtractor,
  requirePresentationAccess,
  getTokenFrom,
}
