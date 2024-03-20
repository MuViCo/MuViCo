const jwt = require("jsonwebtoken")
const { log } = require("console")
const { get } = require("http")
const User = require("../models/user")
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
  getTokenFrom(request)
  const { token } = request
  if (token) {
    const decodedToken = jwt.verify(token, process.env.SECRET)
    if (!decodedToken.id) {
      return response.status(401).json({ error: "token invalid" })
    }

    request.user = await User.findById(decodedToken.id)
  }

  next()

  return null
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

  next(error)

  return null
}

module.exports = {
  requestLogger,
  unknownEndpoint,
  errorHandler,
  userExtractor,
  getTokenFrom,
}
