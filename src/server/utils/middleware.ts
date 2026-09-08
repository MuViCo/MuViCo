import jwt from "jsonwebtoken"
import type { NextFunction, Request, Response } from "express"

import User from "../models/user"
import Presentation from "../models/presentation"
import * as logger from "./logger"

export const requestLogger = (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  logger.info("Method:", request.method)
  logger.info("Path:  ", request.path)
  logger.info("Body:  ", request.body)
  logger.info("---")
  next()
}

/**
 * Extracts the token from the request headers.
 */
export const getTokenFrom = (request: Request) => {
  const auth = request.headers.authorization
  if (auth && auth.toLowerCase().startsWith("bearer ")) {
    request.token = auth.substring(7)
  }
  return null
}

/**
 * Extracts the user from the request token and attaches it to the request object.
 */
export const userExtractor = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    getTokenFrom(request)
    const { token } = request
    if (token) {
      const decodedToken = jwt.verify(token, process.env.SECRET as string)
      if (typeof decodedToken === "string" || !decodedToken.id) {
        return response
          .status(401)
          .json({ error: "token invalid", code: "SESSION_EXPIRED" })
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
export const requirePresentationAccess = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
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

    const isOwner = presentation.user?.toString() === user._id.toString()
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

export const unknownEndpoint = (request: Request, response: Response) => {
  response.status(404).send({ error: "unknown endpoint" })
}

export const errorHandler = (
  error: Error & { code?: number },
  request: Request,
  response: Response,
  next: NextFunction
) => {
  logger.error(error.message)

  if (error.name === "CastError") {
    return response.status(400).send({ error: "malformatted id" })
  }
  if (error.name === "ValidationError") {
    return response.status(400).json({ error: error.message })
  }
  if (error.name === "JsonWebTokenError") {
    return response
      .status(401)
      .json({ error: "invalid token", code: "SESSION_EXPIRED" })
  }
  if (error.name === "TokenExpiredError") {
    return response
      .status(401)
      .json({ error: "token expired", code: "SESSION_EXPIRED" })
  }
  if (error.name === "MongoServerError" && error.code === 11000) {
    return response.status(400).json({ error: "duplicate key error" })
  }

  next(error)

  return null
}
