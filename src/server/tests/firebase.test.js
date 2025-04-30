const admin = require("firebase-admin")
const verifyToken = require("../utils/verifyToken")

jest.mock("firebase-admin", () => {
  return {
    auth: jest.fn(),
    credential: {
      cert: jest.fn(),
    },
    initializeApp: jest.fn(),
    apps: [],
  }
})

jest.mock("@aws-sdk/client-secrets-manager", () => ({
  SecretsManagerClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({ SecretString: "{}" }),
  })),
  GetSecretValueCommand: jest.fn(),
}))

describe("verifyToken middleware", () => {
  let req, res, next

  beforeEach(() => {
    req = {
      headers: {},
    }
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }
    next = jest.fn()

    admin.auth.mockReturnValue({
      verifyIdToken: jest.fn(),
    })
  })

  test("should return 401 if no token is provided", async () => {
    await verifyToken(req, res, next)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: "Token missing" })
  })

  test("should call next if token is valid", async () => {
    req.headers.authorization = "Bearer validToken"
    admin.auth().verifyIdToken.mockResolvedValue({ uid: "testUser" })

    await verifyToken(req, res, next)
    expect(next).toHaveBeenCalled()
    expect(req.user).toEqual({ uid: "testUser" })
  })

  test("should return 401 if token verification fails", async () => {
    req.headers.authorization = "Bearer invalidToken"
    admin.auth().verifyIdToken.mockRejectedValue(new Error("Invalid token"))

    await verifyToken(req, res, next)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({
      error: "Token verification failed",
    })
  })
})
