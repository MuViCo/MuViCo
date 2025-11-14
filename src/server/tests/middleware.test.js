const jwt = require("jsonwebtoken")
const mongoose = require("mongoose")
const User = require("../models/user")
const logger = require("../utils/logger")
const {
  requestLogger,
  unknownEndpoint,
  errorHandler,
  userExtractor,
  getTokenFrom,
} = require("../utils/middleware")

jest.mock("../utils/logger")

describe("Middleware functions", () => {
  let mockRequest
  let mockResponse
  let mockNext

  beforeEach(() => {
    jest.clearAllMocks()
    mockRequest = {
      headers: {},
      body: {},
      path: "/test",
      method: "GET",
    }
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }
    mockNext = jest.fn()
  })

  describe("requestLogger", () => {
    test("should log request method, path, and body", () => {
      mockRequest.method = "POST"
      mockRequest.path = "/api/users"
      mockRequest.body = { username: "test" }

      requestLogger(mockRequest, mockResponse, mockNext)

      expect(logger.info).toHaveBeenCalledWith("Method:", "POST")
      expect(logger.info).toHaveBeenCalledWith("Path:  ", "/api/users")
      expect(logger.info).toHaveBeenCalledWith("Body:  ", { username: "test" })
      expect(logger.info).toHaveBeenCalledWith("---")
      expect(mockNext).toHaveBeenCalled()
    })

    test("should call next middleware", () => {
      requestLogger(mockRequest, mockResponse, mockNext)
      expect(mockNext).toHaveBeenCalled()
    })
  })

  describe("getTokenFrom", () => {
    test("should extract bearer token from authorization header", () => {
      mockRequest.headers.authorization = "bearer test-token-123"

      const result = getTokenFrom(mockRequest)

      expect(mockRequest.token).toBe("test-token-123")
      expect(result).toBeNull()
    })

    test("should extract token with Bearer uppercase", () => {
      mockRequest.headers.authorization = "Bearer test-token-456"

      getTokenFrom(mockRequest)

      expect(mockRequest.token).toBe("test-token-456")
    })

    test("should extract token with BEARER all caps", () => {
      mockRequest.headers.authorization = "BEARER test-token-789"

      getTokenFrom(mockRequest)

      expect(mockRequest.token).toBe("test-token-789")
    })

    test("should not extract token without bearer prefix", () => {
      mockRequest.headers.authorization = "Basic xyz"

      const result = getTokenFrom(mockRequest)

      expect(mockRequest.token).toBeUndefined()
      expect(result).toBeNull()
    })

    test("should not extract token without authorization header", () => {
      mockRequest.headers.authorization = undefined

      const result = getTokenFrom(mockRequest)

      expect(mockRequest.token).toBeUndefined()
      expect(result).toBeNull()
    })

    test("should return null", () => {
      const result = getTokenFrom(mockRequest)
      expect(result).toBeNull()
    })
  })

  describe("userExtractor", () => {
    let originalSecret

    beforeEach(() => {
      originalSecret = process.env.SECRET
      process.env.SECRET = "test-secret"
      jest.spyOn(User, "findById").mockResolvedValue(null)
    })

    afterEach(() => {
      process.env.SECRET = originalSecret
      User.findById.mockRestore()
    })

    test("should extract user from valid token", async () => {
      const userId = new mongoose.Types.ObjectId()
      const token = jwt.sign({ id: userId.toString() }, "test-secret")
      mockRequest.headers.authorization = `Bearer ${token}`

      const mockUser = {
        _id: userId,
        username: "testuser",
      }
      User.findById.mockResolvedValue(mockUser)

      await userExtractor(mockRequest, mockResponse, mockNext)

      expect(mockRequest.user).toEqual(mockUser)
      expect(User.findById).toHaveBeenCalledWith(userId.toString())
      expect(mockNext).toHaveBeenCalled()
    })

    test("should return 401 when token is invalid", async () => {
      mockRequest.headers.authorization = "Bearer invalid-token"

      await userExtractor(mockRequest, mockResponse, mockNext)

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.send).toHaveBeenCalledWith({ error: "token-expired" })
      expect(mockNext).not.toHaveBeenCalled()
    })

    test("should return 401 when token has no id", async () => {
      const token = jwt.sign({ username: "testuser" }, "test-secret")
      mockRequest.headers.authorization = `Bearer ${token}`

      await userExtractor(mockRequest, mockResponse, mockNext)

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.json).toHaveBeenCalledWith({ error: "token invalid" })
    })

    test("should call next() when no token provided", async () => {
      mockRequest.headers.authorization = undefined

      await userExtractor(mockRequest, mockResponse, mockNext)

      expect(mockNext).toHaveBeenCalled()
      expect(mockRequest.user).toBeUndefined()
    })

    test("should return 401 when token is expired", async () => {
      const token = jwt.sign({ id: "userid" }, "test-secret", {
        expiresIn: "-1h", // Expired token
      })
      mockRequest.headers.authorization = `Bearer ${token}`

      await userExtractor(mockRequest, mockResponse, mockNext)

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.send).toHaveBeenCalledWith({ error: "token-expired" })
    })

    test("should handle user not found in database", async () => {
      const userId = new mongoose.Types.ObjectId()
      const token = jwt.sign({ id: userId }, "test-secret")
      mockRequest.headers.authorization = `Bearer ${token}`

      User.findById.mockResolvedValue(null)

      await userExtractor(mockRequest, mockResponse, mockNext)

      expect(mockRequest.user).toBeNull()
      expect(mockNext).toHaveBeenCalled()
    })

    test("should call next only once even with valid token", async () => {
      const userId = new mongoose.Types.ObjectId()
      const token = jwt.sign({ id: userId }, "test-secret")
      mockRequest.headers.authorization = `Bearer ${token}`

      User.findById.mockResolvedValue({ _id: userId, username: "test" })

      await userExtractor(mockRequest, mockResponse, mockNext)

      expect(mockNext).toHaveBeenCalledTimes(1)
    })
  })

  describe("unknownEndpoint", () => {
    test("should return 404 with unknown endpoint error", () => {
      unknownEndpoint(mockRequest, mockResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(404)
      expect(mockResponse.send).toHaveBeenCalledWith({ error: "unknown endpoint" })
    })

    test("should not call next()", () => {
      unknownEndpoint(mockRequest, mockResponse)

      expect(mockNext).not.toHaveBeenCalled()
    })
  })

  describe("errorHandler", () => {
    test("should log error message", () => {
      const error = new Error("Test error")

      errorHandler(error, mockRequest, mockResponse, mockNext)

      expect(logger.error).toHaveBeenCalledWith("Test error")
    })

    test("should handle CastError", () => {
      const error = new Error("Invalid ID")
      error.name = "CastError"

      errorHandler(error, mockRequest, mockResponse, mockNext)

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.send).toHaveBeenCalledWith({ error: "malformatted id" })
    })

    test("should handle ValidationError", () => {
      const error = new Error("Validation failed")
      error.name = "ValidationError"

      errorHandler(error, mockRequest, mockResponse, mockNext)

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({ error: "Validation failed" })
    })

    test("should pass unknown errors to next middleware", () => {
      const error = new Error("Unknown error")
      error.name = "UnknownError"

      errorHandler(error, mockRequest, mockResponse, mockNext)

      expect(mockNext).toHaveBeenCalledWith(error)
    })

    test("should return null for non-error types", () => {
      const error = new Error("Unknown error")
      error.name = "SomeOtherError"

      const result = errorHandler(error, mockRequest, mockResponse, mockNext)

      expect(result).toBeNull()
    })

    test("should handle errors with special characters in message", () => {
      const error = new Error("Error with <special> & characters")
      error.name = "ValidationError"

      errorHandler(error, mockRequest, mockResponse, mockNext)

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Error with <special> & characters",
      })
    })
  })

  describe("userExtractor with token prefix variations", () => {
    beforeEach(() => {
      process.env.SECRET = "test-secret"
      jest.spyOn(User, "findById").mockResolvedValue(null)
    })

    afterEach(() => {
      User.findById.mockRestore()
    })

    test("should handle authorization header with mixed case Bearer", async () => {
      const userId = new mongoose.Types.ObjectId()
      const token = jwt.sign({ id: userId }, "test-secret")
      mockRequest.headers.authorization = `BeArEr ${token}`

      User.findById.mockResolvedValue({ _id: userId })

      await userExtractor(mockRequest, mockResponse, mockNext)

      expect(mockRequest.token).toBe(token)
      expect(mockNext).toHaveBeenCalled()
    })
  })
})
