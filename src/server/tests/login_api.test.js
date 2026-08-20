/*
 * Login API integration tests.
 * Covers password login, Firebase login account linking rules, drive token persistence, and failure cases.
 */
const supertest = require("supertest")
const mongoose = require("mongoose")
const jwt = require("jsonwebtoken")
const { generateHash } = require("../utils/auth.js")
const { hashToken } = require("../utils/refreshToken")
const User = require("../models/user")
const app = require("../app")
const verifyToken = require("../utils/verifyToken")

// Pulls the raw refreshToken cookie value out of a supertest response's
// Set-Cookie header, e.g. "refreshToken=abc123; Path=/api/login; ..." -> "abc123".
const getRefreshCookieValue = (response) => {
  const setCookie = response.headers["set-cookie"] || []
  const cookie = setCookie.find((c) => c.startsWith("refreshToken="))
  return cookie?.split(";")[0].split("=")[1]
}

const api = supertest(app)

// Mock the verifyToken middleware to simulate a valid Firebase token
jest.mock("../utils/verifyToken", () => {
  const middleware = jest.fn((req, res, next) => {
    req.user = {
      uid: "testuid",
      email: "testuser@example.com",
      name: "Test User",
    }
    next()
  })

  return middleware
})

describe("Login API", () => {
  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await generateHash("testpassword")
    const user = new User({ username: "testuser", passwordHash })

    await user.save()
  })

  test("succeeds with valid credentials", async () => {
    const loginData = {
      username: "testuser",
      password: "testpassword",
    }

    const response = await api
      .post("/api/login")
      .send(loginData)
      .expect(200)
      .expect("Content-Type", /application\/json/)

    expect(response.body.token).toBeDefined()
    expect(response.body.username).toBe("testuser")
  })

  test("fails with invalid credentials", async () => {
    const loginData = {
      username: "testuser",
      password: "wrongpassword",
    }

    const response = await api
      .post("/api/login")
      .send(loginData)
      .expect(401)
      .expect("Content-Type", /application\/json/)

    expect(response.body.error).toBe("invalid username or password")
  })

  test("does not match password user by email prefix on Firebase login", async () => {
    const response = await api
      .post("/api/login/firebase")
      .set("Authorization", "Bearer validFirebaseToken")
      .expect(200)
      .expect("Content-Type", /application\/json/)

    expect(response.body.token).toBeDefined()
    expect(response.body.username).toBe("testuser_1")

    const users = await User.find({}).sort({ username: 1 })
    expect(users).toHaveLength(2)
    expect(users[0].username).toBe("testuser")
    expect(users[1].username).toBe("testuser_1")
    expect(users[1].firebaseUid).toBe("testuid")
  })

  test("keeps Google and password users as separate accounts", async () => {
    const response = await api
      .post("/api/login/firebase")
      .set("Authorization", "Bearer validFirebaseToken")
      .expect(200)

    expect(response.body.username).toBe("testuser_1")

    const passwordUser = await User.findOne({ username: "testuser" })
    const googleUser = await User.findOne({ username: "testuser_1" })
    expect(passwordUser.firebaseUid).toBeFalsy()
    expect(googleUser.firebaseUid).toBe("testuid")
  })

  test("links legacy Google-only user by username prefix once", async () => {
    const legacyGoogleUser = new User({ username: "legacyuser" })
    await legacyGoogleUser.save()

    verifyToken.mockImplementationOnce((req, res, next) => {
      req.user = {
        uid: "legacyuid",
        email: "legacyuser@example.com",
      }
      next()
    })

    const response = await api
      .post("/api/login/firebase")
      .set("Authorization", "Bearer validFirebaseToken")
      .expect(200)

    expect(response.body.username).toBe("legacyuser")

    const updatedLegacyUser = await User.findOne({ username: "legacyuser" })
    expect(updatedLegacyUser.firebaseUid).toBe("legacyuid")

    const users = await User.find({})
    expect(users).toHaveLength(2)
  })

  test("links legacy Google-only user with unsanitized email prefix", async () => {
    const legacyGoogleUser = new User({ username: "legacy.user" })
    await legacyGoogleUser.save()

    verifyToken.mockImplementationOnce((req, res, next) => {
      req.user = {
        uid: "legacyunsanitizeduid",
        email: "legacy.user@example.com",
      }
      next()
    })

    const response = await api
      .post("/api/login/firebase")
      .set("Authorization", "Bearer validFirebaseToken")
      .expect(200)

    expect(response.body.username).toBe("legacy.user")

    const updatedLegacyUser = await User.findOne({ username: "legacy.user" })
    expect(updatedLegacyUser.firebaseUid).toBe("legacyunsanitizeduid")

    const users = await User.find({})
    expect(users).toHaveLength(2)
  })

  test("does not auto-link legacy prefix match when passwordHash exists", async () => {
    const passwordHash = await generateHash("legacy-password")
    const legacyPasswordUser = new User({
      username: "legacy.user",
      passwordHash,
    })
    await legacyPasswordUser.save()

    verifyToken.mockImplementationOnce((req, res, next) => {
      req.user = {
        uid: "legacyprotecteduid",
        email: "legacy.user@example.com",
      }
      next()
    })

    const response = await api
      .post("/api/login/firebase")
      .set("Authorization", "Bearer validFirebaseToken")
      .expect(200)

    expect(response.body.username).toBe("legacy.user_1")

    const originalPasswordUser = await User.findOne({ username: "legacy.user" })
    const createdGoogleUser = await User.findOne({ username: "legacy.user_1" })

    expect(originalPasswordUser.firebaseUid).toBeFalsy()
    expect(createdGoogleUser.firebaseUid).toBe("legacyprotecteduid")

    const users = await User.find({})
    expect(users).toHaveLength(3)
  })

  test("saves drive access token for existing user", async () => {
    await User.findOneAndUpdate(
      { username: "testuser" },
      { firebaseUid: "testuid" },
      { new: true }
    )

    const driveAccessToken = "test-drive-token-123"

    const response = await api
      .post("/api/login/firebase")
      .set("Authorization", "Bearer validFirebaseToken")
      .send({ driveAccessToken })
      .expect(200)

    expect(response.body.driveToken).toBe(driveAccessToken)

    // Verify it was saved to the database
    const user = await User.findOne({ username: "testuser" })
    expect(user.driveToken).toBe(driveAccessToken)
  })

  test("saves drive access token for new Firebase user", async () => {
    const driveAccessToken = "new-user-drive-token-456"

    // Mock verifyToken to return a new user
    verifyToken.mockImplementationOnce((req, res, next) => {
      req.user = {
        uid: "newuid",
        email: "newuser@example.com",
        name: "New User",
      }
      next()
    })

    const response = await api
      .post("/api/login/firebase")
      .set("Authorization", "Bearer validFirebaseToken")
      .send({ driveAccessToken })
      .expect(200)

    expect(response.body.driveToken).toBe(driveAccessToken)
    expect(response.body.username).toBe("newuser")

    // Verify new user was created with drive token
    const user = await User.findOne({ username: "newuser" })
    expect(user).toBeDefined()
    expect(user.driveToken).toBe(driveAccessToken)
    expect(user.firebaseUid).toBe("newuid")
  })

  test("updates drive token when logging in with Firebase again", async () => {
    await User.findOneAndUpdate(
      { username: "testuser" },
      { firebaseUid: "testuid" },
      { new: true }
    )

    const firstToken = "first-drive-token"
    const secondToken = "second-drive-token"

    // First login
    await api
      .post("/api/login/firebase")
      .set("Authorization", "Bearer validFirebaseToken")
      .send({ driveAccessToken: firstToken })
      .expect(200)

    // Verify first token is saved
    let user = await User.findOne({ username: "testuser" })
    expect(user.driveToken).toBe(firstToken)

    // Second login with different token
    const response = await api
      .post("/api/login/firebase")
      .set("Authorization", "Bearer validFirebaseToken")
      .send({ driveAccessToken: secondToken })
      .expect(200)

    expect(response.body.driveToken).toBe(secondToken)

    // Verify token was updated in database
    user = await User.findOne({ username: "testuser" })
    expect(user.driveToken).toBe(secondToken)
  })

  test("returns 500 error when user creation fails", async () => {
    // Mock User.save to throw an error
    jest
      .spyOn(User.prototype, "save")
      .mockRejectedValueOnce(new Error("Database error"))

    verifyToken.mockImplementationOnce((req, res, next) => {
      req.user = {
        uid: "erroruid",
        email: "error@example.com",
        name: "Error User",
      }
      next()
    })

    const response = await api
      .post("/api/login/firebase")
      .set("Authorization", "Bearer validFirebaseToken")
      .send({ driveAccessToken: "test-token" })
      .expect(500)

    expect(response.body.error).toBe("Database error")

    // Restore the original implementation
    User.prototype.save.mockRestore()
  })

  test("returns 500 error when token update fails", async () => {
    // First, create a user successfully
    await api
      .post("/api/login/firebase")
      .set("Authorization", "Bearer validFirebaseToken")
      .send({ driveAccessToken: "initial-token" })
      .expect(200)

    // Mock User.save to throw an error on the second call
    jest
      .spyOn(User.prototype, "save")
      .mockRejectedValueOnce(new Error("Save failed"))

    const response = await api
      .post("/api/login/firebase")
      .set("Authorization", "Bearer validFirebaseToken")
      .send({ driveAccessToken: "failing-token" })
      .expect(500)

    expect(response.body.error).toBe("Save failed")

    // Restore the original implementation
    User.prototype.save.mockRestore()
  })
})

describe("Refresh token flow", () => {
  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await generateHash("testpassword")
    const user = new User({ username: "testuser", passwordHash })

    await user.save()
  })

  test("login sets an httpOnly refresh cookie scoped to /api/login", async () => {
    const response = await api
      .post("/api/login")
      .send({ username: "testuser", password: "testpassword" })
      .expect(200)

    const setCookie = response.headers["set-cookie"] || []
    const cookie = setCookie.find((c) => c.startsWith("refreshToken="))

    expect(cookie).toBeDefined()
    expect(cookie).toMatch(/HttpOnly/)
    expect(cookie).toMatch(/Path=\/api\/login/)
  })

  test("exchanges a valid refresh cookie for a new access token", async () => {
    const loginResponse = await api
      .post("/api/login")
      .send({ username: "testuser", password: "testpassword" })
      .expect(200)

    const refreshToken = getRefreshCookieValue(loginResponse)

    const refreshResponse = await api
      .post("/api/login/refresh")
      .set("Cookie", [`refreshToken=${refreshToken}`])
      .expect(200)

    expect(refreshResponse.body.token).toBeDefined()
    const payload = jwt.decode(refreshResponse.body.token)
    expect(payload.username).toBe("testuser")
  })

  test("rotates the refresh token so the old value can't be reused", async () => {
    const loginResponse = await api
      .post("/api/login")
      .send({ username: "testuser", password: "testpassword" })
      .expect(200)

    const originalRefreshToken = getRefreshCookieValue(loginResponse)

    await api
      .post("/api/login/refresh")
      .set("Cookie", [`refreshToken=${originalRefreshToken}`])
      .expect(200)

    await api
      .post("/api/login/refresh")
      .set("Cookie", [`refreshToken=${originalRefreshToken}`])
      .expect(401)
  })

  test("fails with 401 when no refresh cookie is sent", async () => {
    const response = await api.post("/api/login/refresh").expect(401)
    expect(response.body.error).toBe("No refresh token")
  })

  test("fails with 401 for an unknown refresh token", async () => {
    const response = await api
      .post("/api/login/refresh")
      .set("Cookie", ["refreshToken=not-a-real-token"])
      .expect(401)

    expect(response.body.error).toBe("Invalid or expired refresh token")
  })

  test("fails with 401 for an expired refresh token", async () => {
    const rawToken = "a".repeat(64)
    await new User({
      username: "expireduser",
      passwordHash: await generateHash("testpassword"),
      refreshTokenHash: hashToken(rawToken),
      refreshTokenExpires: new Date(Date.now() - 1000),
    }).save()

    await api
      .post("/api/login/refresh")
      .set("Cookie", [`refreshToken=${rawToken}`])
      .expect(401)
  })

  test("logout invalidates the refresh token so it can no longer be used", async () => {
    const loginResponse = await api
      .post("/api/login")
      .send({ username: "testuser", password: "testpassword" })
      .expect(200)

    const refreshToken = getRefreshCookieValue(loginResponse)

    await api
      .post("/api/login/logout")
      .set("Cookie", [`refreshToken=${refreshToken}`])
      .expect(204)

    await api
      .post("/api/login/refresh")
      .set("Cookie", [`refreshToken=${refreshToken}`])
      .expect(401)
  })

  test("logout succeeds even without a refresh cookie", async () => {
    await api.post("/api/login/logout").expect(204)
  })
})

afterAll(async () => {
  await mongoose.connection.close()
})
