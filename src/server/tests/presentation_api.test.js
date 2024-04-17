const supertest = require("supertest")
const Presentation = require("../models/presentation")
const User = require("../models/user")

const app = require("../app")
const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3")

const api = supertest(app)

let authHeader
let testPresentationId


describe("test presentation", () => {
  beforeEach(async () => {
    await User.deleteMany({})
    await Presentation.deleteMany({})
    await api
      .post("/api/signup")
      .send({ username: "testuser", password: "testpassword" })

    const response = await api
      .post("/api/login")
      .send({ username: "testuser", password: "testpassword" })

    authHeader = `Bearer ${response.body.token}`

    await api
      .post("/api/home")
      .set("Authorization", authHeader)
      .send({ name: "Test presentation" })
    const presentation = await Presentation.findOne({
      name: "Test presentation",
    })
    testPresentationId = presentation._id
  })

  describe("GET /api/presentation/:id", () => {
    test("presentation is returned as json", async () => {
      await api
        .get(`/api/presentation/${testPresentationId}`)
        .set("Authorization", authHeader)
        .expect(200)
        .expect("Content-Type", /application\/json/)
    })
  })
  describe("DELETE", () => {
    test(" /api/presentation/:id", async () => {
      await api
        .delete(`/api/presentation/${testPresentationId}`)
        .set("Authorization", authHeader)
        .expect(204)
    })
  })
})
