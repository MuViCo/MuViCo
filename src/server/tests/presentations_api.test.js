const supertest = require("supertest")
const mongoose = require("mongoose")
const Presentation = require("../models/presentation")
const User = require("../models/user")
const app = require("../app")
const { getTokenFrom } = require("../utils/middleware")

const api = supertest(app)

let authHeader

describe("GET /presentations", () => {
  beforeEach(async () => {
    await User.deleteMany({})
    await api
      .post("/api/signup")
      .send({ username: "testuser", password: "testpassword" })
    // Login and get the token
    const response = await api
      .post("/api/login")
      .send({ username: "testuser", password: "testpassword" })

    // Set the token in the authHeader
    authHeader = `Bearer ${response.body.token}`

    await api
      .post("/api/home")
      .set("Authorization", authHeader)
      .send({ name: "Test presentation" })
  })

  test("adding a presentation", async () => {
    await api
      .post("/api/home")
      .set("Authorization", authHeader)
      .send({ name: "Moi tää on testi" })
      .expect(201)
      .expect("Content-Type", /application\/json/)
  })

  test("presentations are returned as json", async () => {
    await api
      .get("/api/home")
      .set("Authorization", authHeader) // Include the token in the request headers
      .expect(200)
      .expect("Content-Type", /application\/json/)
  })

  test("all presentations are returned", async () => {
    const response = await api.get("/api/home").set("Authorization", authHeader)
    expect(response.body).toHaveLength(1)
  })

  test("a specific presentation is within the returned presentations", async () => {
    const response = await api.get("/api/home").set("Authorization", authHeader)
    const contents = response.body.map((r) => r.name)
    expect(contents).toContain("Test presentation")
  })
})

afterAll(async () => {
  await mongoose.connection.close()
})
