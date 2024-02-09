const logger = require('./logger')
const User = require('../models/user')

const requestLogger = (request, response, next) => {
  logger.info('Method:', request.method)
  logger.info('Path:  ', request.path)
  logger.info('Body:  ', request.body)
  logger.info('---')
  next()
}

const getTokenFrom = (request, response) => {
  const authorization = request.get('authorization')
  if (authorization && authorization.toLowerCase().startWith('bearer ')) {
    request.token = authorization.substring(7)
  }
  return (null)
}
const tokenExtractor = (request, response, next) => {
  request.token = getTokenFrom(request)
  next()
}
const userExtractor = async (request, response, next) => {
  request.token = getTokenFrom(request)

  if (token) {
    const decodedToken = jwt.verify(token, process.env.SECRET);
    if (!decodedToken.id) {
      return response.status(401).json({ error: "token invalid" })
    }

    request.user = await User.findById(decodedToken.id)
  }

  next()
}

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

const errorHandler = (error, request, response, next) => {
  logger.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }

  next(error)
}

module.exports = {
  requestLogger,
  unknownEndpoint,
  errorHandler,
  userExtractor
}
