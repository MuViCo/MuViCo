const supertest = require("supertest")
const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const User = require("../models/user")
const app = require("../app")
const verifyToken = require("../utils/verifyToken")

const api = supertest(app)

// Mock the verifyToken middleware to simulate a valid Firebase token
jest.mock("../utils/verifyToken", () => jest.fn((req, res, next) => {
  req.user = {
    uid: "testuid",
    email: "testuser@example.com",
    name: "Test User",
  }
  next()
}))

describe("Login API", () => {
  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash("testpassword", 10)
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


  test("succeeds with valid Firebase token", async () => {
    const response = await api
      .post("/api/login/firebase")
      .set("Authorization", "Bearer validFirebaseToken")
      .expect(200)
      .expect("Content-Type", /application\/json/)

    expect(response.body.token).toBeDefined()
    expect(response.body.username).toBe("testuser")
  })

  test("saves drive access token for existing user", async () => {
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
  })

  test("updates drive token when logging in with Firebase again", async () => {
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
    jest.spyOn(User.prototype, "save").mockRejectedValueOnce(new Error("Database error"))

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
    jest.spyOn(User.prototype, "save").mockRejectedValueOnce(new Error("Save failed"))

    const response = await api
      .post("/api/login/firebase")
      .set("Authorization", "Bearer validFirebaseToken")
      .send({ driveAccessToken: "failing-token" })
      .expect(500)

    expect(response.body.error).toBe("Save failed")

    // Restore the original implementation
    User.prototype.save.mockRestore()
  })})

afterAll(async () => {
  await mongoose.connection.close()
})