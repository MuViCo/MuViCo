const supertest = require("supertest")
const mongoose = require("mongoose")
const Presentation = require("../models/presentation")
const User = require("../models/user")
const app = require("../app")
jest.mock("aws-sdk/client-s3", () => {
  return {
    S3: jest.fn().mockImplementation(() => {
      return {
        upload: jest.fn().mockImplementation((_, callback) => {
          callback(null, { Location: "https://example.com/image.jpg" })
        }),
      }
    }),
  }
})

const api = supertest(app)

let authHeader

describe("GET /presentation", () => {
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
      .post("/api/presentation")
      .set("Authorization", authHeader)
      .send({ name: "Test presentation" })
  })

  test("should upload presentation image to AWS S3", async () => {
    const response = await api
      .post("/api/presentation/upload")
      .set("Authorization", authHeader)
      .attach("image", "path/to/image.jpg")

    expect(response.status).toBe(200)
    expect(response.body.imageUrl).toBe("https://example.com/image.jpg")
  })

  test("should return all presentations", async () => {
    const response = await api
      .get("/api/presentation")
      .set("Authorization", authHeader)

    expect(response.status).toBe(200)
    expect(response.body.length).toBe(1)
    expect(response.body[0].name).toBe("Test presentation")
  })
})
