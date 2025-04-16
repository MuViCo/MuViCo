const supertest = require("supertest")
const mongoose = require("mongoose")
const Presentation = require("../models/presentation")
const User = require("../models/user")
const app = require("../app")
const { request } = require("http")

const api = supertest(app)

let authHeader

describe("POST /link-drive and /unlink-drive", () => {
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
  })

  test("linking drive succesfully", async () => {
    const response = await api
      .post("/api/users/link-drive")
      .set("Authorization", authHeader)
      .send({ driveAccessToken: "test-token" })
      .expect(200)
      .expect("Content-Type", /application\/json/)

    expect(response.body.driveToken).toBe("test-token")
    expect(response.body.message).toBe("Google Drive linked successfully")
  })

  test("linking drive unsuccesfully", async () => {
    await api
      .post("/api/users/link-drive")
      .send({ driveAccessToken: "test-token" })
      .expect(500)
      .expect("Content-Type", /application\/json/)
  })

  test("unlinking drive succesfully", async () => {
    await api
      .post("/api/users/link-drive")
      .set("Authorization", authHeader)
      .send({ driveAccessToken: "test-token" })
      .expect(200)
      .expect("Content-Type", /application\/json/)

    const response = await api
      .post("/api/users/unlink-drive")
      .set("Authorization", authHeader)
      .expect(200)
      .expect("Content-Type", /application\/json/)

    expect(response.body.driveToken).toBeNull()
    expect(response.body.message).toBe("Google Drive unlinked successfully")
  })

  test("unlinking drive unsuccesfully", async () => {
    await api
      .post("/api/users/link-drive")
      .set("Authorization", authHeader)
      .send({ driveAccessToken: "test-token" })
      .expect(200)
      .expect("Content-Type", /application\/json/)

    await api
      .post("/api/users/unlink-drive")
      .expect(500)
      .expect("Content-Type", /application\/json/)
  })
})

afterAll(async () => {
  await mongoose.connection.close()
})
