const supertest = require("supertest")
const mongoose = require("mongoose")
const Presentation = require("../models/presentation")
const User = require("../models/user")
const app = require("../app")
const { auth } = require("firebase-admin")

const api = supertest(app)

let authHeader
let presentationId
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

    const createRes = await api
      .post("/api/home")
      .set("Authorization", authHeader)
      .send({ name: "Test presentation" })
      .expect(201)
      .expect("Content-Type", /application\/json/)

    presentationId = createRes.body.id
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

  test("returns 401 without authorization", async () => {
    await api
      .get("/api/home")
      .expect(401)
      .expect("Content-Type", /application\/json/)
      .expect(res => {
        expect(res.body.error).toBe("operation not permitted")
      })
  })

  test("returns 400 with invalid presentation id", async () => {
    await api
      .get("/api/home/invalid-id")
      .set("Authorization", authHeader)
      .expect(400)
      .expect("Content-Type", /application\/json/)
      .expect(res => {
        expect(res.body.error).toBe("invalid presentation id")
      })
  })

  test("fetches a specific presentation by id", async () => {
    const response = await api
      .get(`/api/home/${presentationId}`)
      .set("Authorization", authHeader)
      .expect(200)
      .expect("Content-Type", /application\/json/)

    expect(response.body.name).toBe("Test presentation")
  })

test("returns 404 when fetching other user's presentation", async () => {
  const otherRes = await api
    .post("/api/signup")
    .send({ username: "other", password: "secret" })
  const otherLogin = await api
    .post("/api/login")
    .send({ username: "other", password: "secret" })
  const otherAuth = `Bearer ${otherLogin.body.token}`

  const otherPres = await api
    .post("/api/home")
    .set("Authorization", otherAuth)
    .send({ name: "Other's presentation" })

  await api
    .get(`/api/home/${otherPres.body.id}`)
    .set("Authorization", authHeader)
    .expect(404)
    .expect("Content-Type", /application\/json/)
    .expect(res => {
      expect(res.body.error).toBe("presentation not found")
    })
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

  test("returns 401 without name", async () => {
    await api
      .post("/api/home")
      .set("Authorization", authHeader)
      .send({})
      .expect(401)
      .expect("Content-Type", /application\/json/)
      .expect(res => {
        expect(res.body.error).toBe("operation not permitted")
      })
  })

test("returns only googleDrive presentations when user has driveToken", async () => {
  const user = await User.findOne({ username: "testuser" })
  user.driveToken = "test-drive-token"
  await user.save()

  const presRes = await api
    .post("/api/home")
    .set("Authorization", authHeader)
    .send({ name: "Drive presentation" })
    .expect(201)

  const response = await api
    .get("/api/home")
    .set("Authorization", authHeader)
    .expect(200)

  expect(response.body.length).toBeGreaterThan(0)
  response.body.forEach(p => {
    expect(p.storage).toBe("googleDrive")
  })
})
})
afterAll(async () => {
  await mongoose.connection.close()
})
