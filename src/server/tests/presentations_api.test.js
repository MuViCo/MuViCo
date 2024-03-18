const supertest = require("supertest")
const mongoose = require("mongoose")
const Presentation = require("../models/presentation")
const User = require("../models/user")
const app = require("../app")

const api = supertest(app)

let authHeader

describe("GET /presentations", () => {
  beforeEach(async () => {
    await User.deleteMany({})
    await Presentation.deleteMany({})
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
      .set("Authorization", authHeader)
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

describe("POST /presentations", () => {
  beforeEach(async () => {
    await Presentation.deleteMany({})
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
  })

  test("a valid presentation can be added", async () => {
    await api
      .post("/api/home")
      .set("Authorization", authHeader)
      .send({ name: "Test presentation" })
      .expect(201)
      .expect("Content-Type", /application\/json/)

    const presentationsAtEnd = await Presentation.find({})
    expect(presentationsAtEnd).toHaveLength(1)
  })

  test("a presentation without a name is not added", async () => {
    await api
      .post("/api/home")
      .set("Authorization", authHeader)
      .send({ name: "" })
      .expect(400)

    const presentationsAtEnd = await Presentation.find({})
    expect(presentationsAtEnd).toHaveLength(0)
  })
})

afterAll(async () => {
  await mongoose.connection.close()
})
