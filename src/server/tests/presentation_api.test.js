const supertest = require("supertest")
const mongoose = require("mongoose")
const Presentation = require("../models/presentation")
const User = require("../models/user")

const app = require("../app")
const fs = require("fs")
const path = require("path")

const api = supertest(app)

let authHeader
let testPresentationId

const mockImageBuffer = fs.readFileSync(path.join(__dirname, "mock_image.png"))

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

    if (!presentation) {
      throw new Error(
        "Error in beforeEach: Test presentation not found after creation"
      )
    }

    testPresentationId = presentation._id
  })

  const createCue = async (index, cueName, screen) => {
    if (!testPresentationId) {
      throw new Error("Error in createCue: testPresentationId is undefined")
    }

    const url = `/api/presentation/${testPresentationId}`

    const response = await api
      .put(url)
      .attach("image", mockImageBuffer, "mock_image.png")
      .field("index", index)
      .field("cueName", cueName)
      .field("screen", screen)
      .field("fileName", "")

    return response
  }

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
      await api.delete(`/api/presentation/${testPresentationId}`).expect(204)
    })
  })

  describe("Test error handling", () => {
    it("GET /api/presentation/:id with invalid ID should return 401", async () => {
      const response = await api.get(
        "/api/presentation/000000000000000000000000"
      )

      expect(response.status).toBe(401)
    })

    it("DELETE /api/presentation/:id with invalid ID should return 500", async () => {
      const response = await api.delete(
        "/api/presentation/000000000000000000000000"
      )

      expect(response.status).toBe(500)
    })

    it("PUT /api/presentation/:id with missing required fields should return 400", async () => {
      const response = await api.put("/api/presentation/:id")

      expect(response.status).toBe(400)
    })
  })

  describe("PUT /api/presentation/:id", () => {
    const validCases = [
      [0, 1],
      [50, 2],
      [100, 4],
    ]

    test.each(validCases)(
      "creates cue with valid data (index=%i, screen=%i)",
      async (index, screen) => {
        const response = await createCue(index, "Test Cue", screen)
        expect(response.status).toBe(200)
      }
    )

    const invalidCases = [
      [-1, 1, "Invalid cue index: -1. Index must be between 0 and 100."],
      [101, 4, "Invalid cue index: 101. Index must be between 0 and 100."],
      [0, 0, "Invalid cue screen: 0. Screen must be between 1 and 4."],
      [100, 5, "Invalid cue screen: 5. Screen must be between 1 and 4."],
    ]

    test.each(invalidCases)(
      "throws error with invalid data (index=%i, screen=%i)",
      async (index, screen, error) => {
        const res = await createCue(index, "Test Cue", screen)
        expect(res.status).toBe(400)
        expect(res.body.error).toBe(error)
      }
    )

    test("throws error with missing fields", async () => {
      const response = await api
        .put(`/api/presentation/${testPresentationId}`)
        .field("index", "1")
        .field("fileName", "")
        .expect(400)

      expect(response.body.error).toBe("Missing required fields")
    })
  })

  describe("PUT /api/presentation/:id/:cueId", () => {
    let testCueId

    beforeEach(async () => {
      const response = await createCue(1, "Test Cue", 2)
      testCueId = response.body.cues[0]._id
    })

    const validCases = [
      [0, 1],
      [50, 2],
      [100, 4],
    ]

    test.each(validCases)(
      "updates cue with valid data (index=%i, screen=%i)",
      async (index, screen) => {
        await api
          .put(`/api/presentation/${testPresentationId}/${testCueId}`)
          .field("index", index)
          .field("cueName", "Updated Test Cue")
          .field("screen", screen)
          .field("fileName", "")
          .expect(200)
      }
    )

    const invalidCases = [
      [-1, 1, "Invalid cue index: -1. Index must be between 0 and 100."],
      [101, 4, "Invalid cue index: 101. Index must be between 0 and 100."],
      [0, 0, "Invalid cue screen: 0. Screen must be between 1 and 4."],
      [100, 5, "Invalid cue screen: 5. Screen must be between 1 and 4."],
    ]

    test.each(invalidCases)(
      "throws error with invalid data (index=%i, screen=%i)",
      async (index, screen, error) => {
        const response = await api
          .put(`/api/presentation/${testPresentationId}/${testCueId}`)
          .field("index", index)
          .field("cueName", "Updated Test Cue")
          .field("screen", screen)
          .field("fileName", "")
          .expect(400)

        expect(response.body.error).toBe(error)
      }
    )

    test("throws error with missing fields", async () => {
      const response = await api
        .put(`/api/presentation/${testPresentationId}/${testCueId}`)
        .field("index", "1")
        .field("fileName", "")
        .expect(400)

      expect(response.body.error).toBe("Missing required fields")
    })
  })
})

afterAll(async () => {
  await mongoose.connection.close()
})
