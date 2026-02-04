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

describe("POST /change-password", () => {
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
  })

  test("changing password successfully with valid current password", async () => {
    const response = await api
      .post("/api/users/change-password")
      .set("Authorization", authHeader)
      .send({ 
        currentPassword: "testpassword", 
        newPassword: "newpassword123" 
      })
      .expect(201)
      .expect("Content-Type", /application\/json/)

    expect(response.body).toHaveProperty("id")
    expect(response.body.username).toBe("testuser")
  })

  test("changing password fails with invalid current password", async () => {
    await api
      .post("/api/users/change-password")
      .set("Authorization", authHeader)
      .send({ 
        currentPassword: "wrongpassword", 
        newPassword: "newpassword123" 
      })
      .expect(401)
      .expect("Content-Type", /application\/json/)
  })

  test("changing password fails with weak new password", async () => {
    await api
      .post("/api/users/change-password")
      .set("Authorization", authHeader)
      .send({ 
        currentPassword: "testpassword", 
        newPassword: "wk" 
      })
      .expect(400)
      .expect("Content-Type", /application\/json/)
  })

  test("changing password fails without authentication", async () => {
    await api
      .post("/api/users/change-password")
      .send({ 
        currentPassword: "testpassword", 
        newPassword: "newpassword123" 
      })
      .expect(401)
  })

  test("new password works on next login", async () => {
    await api
      .post("/api/users/change-password")
      .set("Authorization", authHeader)
      .send({ 
        currentPassword: "testpassword", 
        newPassword: "newpassword123" 
      })
      .expect(201)

    const loginResponse = await api
      .post("/api/login")
      .send({ 
        username: "testuser", 
        password: "newpassword123" 
      })
      .expect(200)

    expect(loginResponse.body.token).toBeDefined()
  })

  test("old password no longer works", async () => {
    await api
      .post("/api/users/change-password")
      .set("Authorization", authHeader)
      .send({ 
        currentPassword: "testpassword", 
        newPassword: "newpassword123" 
      })
      .expect(201)

    await api
      .post("/api/login")
      .send({ 
        username: "testuser", 
        password: "testpassword" 
      })
      .expect(401)
  })
})

afterAll(async () => {
  await mongoose.connection.close()
})
