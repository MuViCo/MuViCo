const User = require("../models/user")
const supertest = require("supertest")
const app = require("../app")
const mongoose = require("mongoose")

const api = supertest(app)

let authHeader

describe("Get /admin as admin", () => {
  beforeEach(async () => {
    await User.deleteMany({})
    await api
      .post("/api/signup")
      .send({ username: "testuser", password: "testpassword" })
    await api
      .post("/api/signup")
      .send({ username: "testadmin", password: "testpassword" })
    // Set the admin status for the testadmin user
    await User.findOneAndUpdate({ username: "testadmin" }, { isAdmin: true })
    // Login and get the token
    const response = await api
      .post("/api/login")
      .send({ username: "testadmin", password: "testpassword" })

    // Set the token in the authHeader
    authHeader = `Bearer ${response.body.token}`
    await api
      .post("/api/home")
      .set("Authorization", authHeader)
      .send({ name: "Test presentation" })
  })

  test("users are returned as json", async () => {
    await api
      .get("/api/admin")
      .set("Authorization", authHeader)
      .expect(200)
      .expect("Content-Type", /application\/json/)
  })

  test("all users are returned", async () => {
    const response = await api
      .get("/api/admin")
      .set("Authorization", authHeader)
      .expect(200)

    expect(response.body).toHaveLength(2)
  })

  test("a specific user has the correct username", async () => {
    const response = await api
      .get("/api/admin")
      .set("Authorization", authHeader)
    const usernames = response.body.map((r) => r.username)

    expect(usernames).toContain("testuser")
  })
})

describe("Get /admin as not admin", () => {
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
  })

  test("trying to get users as not admin", async () => {
    await api.get("/api/admin").set("Authorization", authHeader).expect(401)
  })
})

describe("Delete /admin/user/:id", () => {
  beforeEach(async () => {
    await User.deleteMany({})
    await api
      .post("/api/signup")
      .send({ username: "testuser", password: "testpassword" })
    await api
      .post("/api/signup")
      .send({ username: "testadmin", password: "testpassword" })
    // Set the admin status for the testadmin user
    await User.findOneAndUpdate({ username: "testadmin" }, { isAdmin: true })
  })

  test("deleting a user as an admin", async () => {
    const response = await api
      .post("/api/login")
      .send({ username: "testadmin", password: "testpassword" })

    authHeader = `Bearer ${response.body.token}`
    const user = await User.findOne({ username: "testuser" })
    await api
      .delete(`/api/admin/user/${user.id}`)
      .set("Authorization", authHeader)
      .expect(204)
  })
  test("trying to delete a user as not admin", async () => {
    const response = await api
      .post("/api/login")
      .send({ username: "testuser", password: "testpassword" })

    authHeader = `Bearer ${response.body.token}`
    const user = await User.findOne({ username: "testuser" })
    await api
      .delete(`/api/admin/user/${user.id}`)
      .set("Authorization", authHeader)
      .expect(401)
  })
})

afterAll(async () => {
  await mongoose.connection.close()
})
