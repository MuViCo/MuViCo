const supertest = require("supertest")
const mongoose = require("mongoose")
const User = require("../models/user")
const app = require("../app")

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

describe("Put /admin/makeadmin/:id", () => {
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

  test("making a user an admin as an admin", async () => {
    const response = await api
      .post("/api/login")
      .send({ username: "testadmin", password: "testpassword" })

    authHeader = `Bearer ${response.body.token}`
    const user = await User.findOne({ username: "testuser" })
    
    const result = await api
      .put(`/api/admin/makeadmin/${user.id}`)
      .set("Authorization", authHeader)
      .expect(200)
      .expect("Content-Type", /application\/json/)

    expect(result.body.isAdmin).toBe(true)
    expect(result.body.username).toBe("testuser")
  })

  test("making a user an admin sets isAdmin to true in database", async () => {
    const response = await api
      .post("/api/login")
      .send({ username: "testadmin", password: "testpassword" })

    authHeader = `Bearer ${response.body.token}`
    const user = await User.findOne({ username: "testuser" })
    
    await api
      .put(`/api/admin/makeadmin/${user.id}`)
      .set("Authorization", authHeader)
      .expect(200)

    const updatedUser = await User.findOne({ username: "testuser" })
    expect(updatedUser.isAdmin).toBe(true)
  })

  test("trying to make a user admin as not admin", async () => {
    const response = await api
      .post("/api/login")
      .send({ username: "testuser", password: "testpassword" })

    authHeader = `Bearer ${response.body.token}`
    const user = await User.findOne({ username: "testadmin" })
    
    await api
      .put(`/api/admin/makeadmin/${user.id}`)
      .set("Authorization", authHeader)
      .expect(401)
  })

  test("trying to make a user admin without authorization", async () => {
    const user = await User.findOne({ username: "testuser" })
    
    await api
      .put(`/api/admin/makeadmin/${user.id}`)
      .expect(401)
  })

  test("trying to make a non-existent user admin", async () => {
    const response = await api
      .post("/api/login")
      .send({ username: "testadmin", password: "testpassword" })

    authHeader = `Bearer ${response.body.token}`
    const fakeId = new mongoose.Types.ObjectId()
    
    const result = await api
      .put(`/api/admin/makeadmin/${fakeId}`)
      .set("Authorization", authHeader)
      .expect(404)
      
    expect(result.body.error).toBe("user not found")
  })
})

describe("Get /admin/userspresentations/:id", () => {
  let userId
  let adminToken

  beforeEach(async () => {
    await User.deleteMany({})
    const Presentation = require("../models/presentation")
    await Presentation.deleteMany({})

    // Create test users
    await api
      .post("/api/signup")
      .send({ username: "testuser", password: "testpassword" })
    await api
      .post("/api/signup")
      .send({ username: "testadmin", password: "testpassword" })
    
    // Set admin status
    await User.findOneAndUpdate({ username: "testadmin" }, { isAdmin: true })
    
    // Get admin token
    const response = await api
      .post("/api/login")
      .send({ username: "testadmin", password: "testpassword" })
    authHeader = `Bearer ${response.body.token}`

    // Get user id
    const user = await User.findOne({ username: "testuser" })
    userId = user.id

    // Create presentations for testuser
    await api
      .post("/api/home")
      .set("Authorization", authHeader)
      .send({ name: "Admin's Presentation" })

    const userToken = await api
      .post("/api/login")
      .send({ username: "testuser", password: "testpassword" })
    
    await api
      .post("/api/home")
      .set("Authorization", `Bearer ${userToken.body.token}`)
      .send({ name: "User's Presentation 1" })
    
    await api
      .post("/api/home")
      .set("Authorization", `Bearer ${userToken.body.token}`)
      .send({ name: "User's Presentation 2" })
  })

  test("getting user presentations as admin", async () => {
    const result = await api
      .get(`/api/admin/userspresentations/${userId}`)
      .set("Authorization", authHeader)
      .expect(200)
      .expect("Content-Type", /application\/json/)

    expect(Array.isArray(result.body)).toBe(true)
  })

  test("getting user presentations returns correct number of presentations", async () => {
    const result = await api
      .get(`/api/admin/userspresentations/${userId}`)
      .set("Authorization", authHeader)
      .expect(200)

    expect(result.body.length).toBe(2)
  })

  test("getting user presentations returns presentations with correct names", async () => {
    const result = await api
      .get(`/api/admin/userspresentations/${userId}`)
      .set("Authorization", authHeader)
      .expect(200)

    const names = result.body.map(p => p.name)
    expect(names).toContain("User's Presentation 1")
    expect(names).toContain("User's Presentation 2")
  })

  test("trying to get user presentations as not admin", async () => {
    const userResponse = await api
      .post("/api/login")
      .send({ username: "testuser", password: "testpassword" })

    const userToken = `Bearer ${userResponse.body.token}`

    await api
      .get(`/api/admin/userspresentations/${userId}`)
      .set("Authorization", userToken)
      .expect(401)
  })

  test("trying to get user presentations without authorization", async () => {
    await api
      .get(`/api/admin/userspresentations/${userId}`)
      .expect(401)
  })

  test("getting presentations for user with no presentations", async () => {
    // Create a new user with no presentations
    await api
      .post("/api/signup")
      .send({ username: "emptyuser", password: "testpassword" })
    
    const emptyUser = await User.findOne({ username: "emptyuser" })

    const result = await api
      .get(`/api/admin/userspresentations/${emptyUser.id}`)
      .set("Authorization", authHeader)
      .expect(200)

    expect(result.body.length).toBe(0)
  })
})

afterAll(async () => {
  await mongoose.connection.close()
})
