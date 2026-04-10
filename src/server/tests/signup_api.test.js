const mongoose = require("mongoose")
const supertest = require("supertest")
const app = require("../app")
const {
  minPwLength,
  maxPwLength,
  minUsernameLength,
  maxUsernameLength,
} = require("../../constants.js")

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

  test("fails with status code 400 if username is not string", async () => {
    const usersAtStart = await usersInDb()

    const invalidUser = {
      username: 12345,
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

    const result = await api.post("/api/signup").send(invalidUser).expect(400)

    expect(result.body.error).toContain(
      `username must be at least ${minUsernameLength} characters`
    )
  })

  test("fails if password is only whitespace", async () => {
    const invalidUser = {
      username: "validuser",
      password: "        ",
    }

    const result = await api.post("/api/signup").send(invalidUser).expect(400)

    expect(result.body.error).toContain("password cannot contain only spaces")
  })

  test("fails if password is shorter than minimum length", async () => {
    const invalidUser = {
      username: "validuser",
      password: "a".repeat(minPwLength - 1),
    }

    const result = await api.post("/api/signup").send(invalidUser).expect(400)

    expect(result.body.error).toContain(
      `password must be at least ${minPwLength} characters`
    )
  })

  test("fails if username has unsupported characters", async () => {
    const invalidUser = {
      username: "test@user",
      password: "validpassword",
    }

    const result = await api.post("/api/signup").send(invalidUser).expect(400)

    expect(result.body.error).toContain(
      "username can only contain letters, numbers, dots, underscores, and hyphens"
    )
  })

  test("fails if username starts with special character", async () => {
    const invalidUser = {
      username: ".testuser",
      password: "validpassword",
    }

    const result = await api.post("/api/signup").send(invalidUser).expect(400)

    expect(result.body.error).toContain(
      "username must start and end with a letter or number"
    )
  })

  test("fails if username has consecutive special characters", async () => {
    const invalidUser = {
      username: "test..user",
      password: "validpassword",
    }

    const result = await api.post("/api/signup").send(invalidUser).expect(400)

    expect(result.body.error).toContain(
      "username cannot contain consecutive special characters"
    )
  })

  test("fails if username exceeds maximum length", async () => {
    const invalidUser = {
      username: "a".repeat(maxUsernameLength + 1),
      password: "validpassword",
    }

    const result = await api.post("/api/signup").send(invalidUser).expect(400)

    expect(result.body.error).toContain(
      `username can be at most ${maxUsernameLength} characters`
    )
  })

  test("fails if password exceeds maximum length", async () => {
    const invalidUser = {
      username: "validuser",
      password: "a".repeat(maxPwLength + 1),
    }

    const result = await api.post("/api/signup").send(invalidUser).expect(400)

    expect(result.body.error).toContain(
      `password must be at most ${maxPwLength} characters`
    )
  })

  test("fails if password contains unsupported characters", async () => {
    const invalidUser = {
      username: "validuser",
      password: "validpass😀",
    }

    const result = await api.post("/api/signup").send(invalidUser).expect(400)

    expect(result.body.error).toContain(
      "password contains unsupported characters"
    )
  })

  test("trims username and password before saving", async () => {
    const newUser = {
      username: "  trimmeduser  ",
      password: "  trimmedpass  ",
    }

    const response = await api.post("/api/signup").send(newUser).expect(201)

    expect(response.body.username).toBe("trimmeduser")

    const savedUser = await User.findOne({ username: "trimmeduser" })
    expect(savedUser).toBeDefined()
    expect(savedUser.username).toBe("trimmeduser")
  })
})

afterAll(async () => {
  await mongoose.connection.close()
})
