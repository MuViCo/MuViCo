const supertest = require("supertest")
const Presentation = require("../models/presentation")
const User = require("../models/user")

const app = require("../app")
const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3")

const api = supertest(app)

let authHeader
let testPresentationId

const mockS3Instance = {
  putObjectCommand: jest.fn().mockReturnThis(),
  getObjectCommand: jest.fn().mockReturnThis(),
  deleteObjectCommand: jest.fn().mockReturnThis(),
  promise: jest.fn().mockReturnThis(),
  catch: jest.fn(),
}

jest.mock("aws-sdk", () => {
  return { S3: jest.fn(() => mockS3Instance) }
})

describe("S3", () => {
  let s3service

  beforeEach(() => {
    s3service = new S3service()
  })

  test("upload file to s3 bucket", async () => {
    const result = await s3service.
  })
})

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
