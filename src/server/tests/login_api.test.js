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

})

afterAll(async () => {
  await mongoose.connection.close()
})