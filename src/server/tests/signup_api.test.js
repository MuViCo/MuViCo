const mongoose = require("mongoose")
const supertest = require("supertest")
const app = require("../app")

const api = supertest(app)
const Presentation = require("../models/presentation")
const User = require("../models/user")
const { usersInDb } = require("./test_helper")


const presentation1 = new Presentation({ name: "Test Presentation 1" })
const presentation2 = new Presentation({ name: "Another Presentation" })


const user1 = new User({
  username: "testuser",
  passwordHash: "testpassword",
  presentations: [presentation1.id, presentation2.id],
})

describe("creation of a new user", () => {
  beforeEach(async () => {
    await User.deleteMany({})
    await User.insertMany(user1)
  })

  test("succeeds with a fresh username", async () => {
    const usersAtStart = await usersInDb()

    const newUser = {
      username: "testuser2",
      password: "testpassword2",
    }

    await api
      .post("/api/signup")
      .send(newUser)
      .expect(201)
      .expect("Content-Type", /application\/json/)

    const usersAtEnd = await usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

    const usernames = usersAtEnd.map((u) => u.username)
    expect(usernames).toContain(newUser.username)
  })

  test("fails with status code 400 if username is already taken", async () => {
    const usersAtStart = await usersInDb()

    const newUser = {
      username: "testuser",
      password: "testpassword",
    }

    const result = await api
      .post("/api/signup")
      .send(newUser)
      .expect(401)
      .expect("Content-Type", /application\/json/)

    expect(result.body.error).toContain("Username already exists")

    const usersAtEnd = await usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })

  test("fails with status code 400 if validation fails", async () => {
    const usersAtStart = await usersInDb()

    const invalidUser = {
      username: "te",
      password: "te",
    }

    await api
      .post("/api/signup")
      .send(invalidUser)
      .expect(400)
      .expect("Content-Type", /application\/json/)

    const usersAtEnd = await usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })

  test("fails with status code 400 if user fields are missing", async () => {
    const usersAtStart = await usersInDb()

    const invalidUser = {
      username: "testuser",
    }

    await api
      .post("/api/signup")
      .send(invalidUser)
      .expect(400)
      .expect("Content-Type", /application\/json/)

    const usersAtEnd = await usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })

  test("fails if username is only whitespace", async () => {
    const invalidUser = {
      username: "   ",
      password: "validpassword",
    }

    const result = await api
      .post("/api/signup")
      .send(invalidUser)
      .expect(400)

    expect(result.body.error).toContain("username must be at least 3 characters long")
  })

  test("fails if password is only whitespace", async () => {
    const invalidUser = {
      username: "validuser",
      password: "   ",
    }

    const result = await api
      .post("/api/signup")
      .send(invalidUser)
      .expect(400)

    expect(result.body.error).toContain("password must be at least 3 characters long")
  })

  test("trims username and password before saving", async () => {
    const newUser = {
      username: "  trimmeduser  ",
      password: "  trimmedpass  ",
    }

    const response = await api
      .post("/api/signup")
      .send(newUser)
      .expect(201)

    expect(response.body.username).toBe("trimmeduser")

    const savedUser = await User.findOne({ username: "trimmeduser" })
    expect(savedUser).toBeDefined()
    expect(savedUser.username).toBe("trimmeduser")
  })
})

afterAll(async () => {
  await mongoose.connection.close()
})
