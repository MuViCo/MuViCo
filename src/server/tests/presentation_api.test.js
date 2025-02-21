const supertest = require("supertest")
const Presentation = require("../models/presentation")
const User = require("../models/user")

const app = require("../app")
const { describe } = require("node:test")
const fs = require("fs")
const path = require("path")

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

  // Helper function for creating cues
  const createCue = async (screen) => {
    const imageFilePath = path.join(__dirname, "mock_image.png")
    const image = fs.readFileSync(imageFilePath)

    const cueResponse = await api
      .put(`/api/presentation/${testPresentationId}`)
      .attach("image", image, "mock_image.png")
      .field("index", "1")
      .field("cueName", "Test Cue")
      .field("screen", screen)
      .field("fileName", "")

    return cueResponse.body.cues[0]
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

  describe("PUT /api/presentation/:id", () => {
    test("update presentation", async () => {
      const imageFilePath = path.join(__dirname, "mock_image.png")
      const image = fs.readFileSync(imageFilePath)

      await api
        .put(`/api/presentation/${testPresentationId}`)
        .attach("image", image, "mock_image.png")
        .field("index", "1") // Add other form fields as needed
        .field("cueName", "Test Cue")
        .field("screen", "1")
        .field("fileName", "")
        .expect(200)
    })
  })
  describe("Test error handling", () => {
    it("GET /api/presentation/:id with invalid ID should return 401", async () => {
      const response = await api.get("/api/presentation/invalid_id")

      expect(response.status).toBe(401)
    })

    it("DELETE /api/presentation/:id with invalid ID should return 500", async () => {
      const response = await api.delete("/api/presentation/invalid_id")

      expect(response.status).toBe(500)
    })

    it("PUT /api/presentation/:id with missing required fields should return 400", async () => {
      const response = await api.put("/api/presentation/:id")

      expect(response.status).toBe(400)
    })
  })

  describe("PUT /api/presentation/:id - Cue creation tests", () => {
    test("Create cue with valid screen 1", async () => {
      const imageFilePath = path.join(__dirname, "mock_image.png")
      const image = fs.readFileSync(imageFilePath)

      await api
        .put(`/api/presentation/${testPresentationId}`)
        .attach("image", image, "mock_image.png")
        .field("index", "1")
        .field("cueName", "Test Cue")
        .field("screen", "1") // Valid screen
        .field("fileName", "")
        .expect(200)
    })

    test("Create cue with valid screen 4", async () => {
      const imageFilePath = path.join(__dirname, "mock_image.png")
      const image = fs.readFileSync(imageFilePath)

      await api
        .put(`/api/presentation/${testPresentationId}`)
        .attach("image", image, "mock_image.png")
        .field("index", "1")
        .field("cueName", "Test Cue")
        .field("screen", "4") // Valid screen
        .field("fileName", "")
        .expect(200)
    })

    test("Create cue with invalid screen 0", async () => {
      const imageFilePath = path.join(__dirname, "mock_image.png")
      const image = fs.readFileSync(imageFilePath)

      await api
        .put(`/api/presentation/${testPresentationId}`)
        .attach("image", image, "mock_image.png")
        .field("index", "1")
        .field("cueName", "Test Cue")
        .field("screen", "0") // Invalid screen
        .field("fileName", "")
        .expect(400)
    })

    test("Create cue with invalid screen 5", async () => {
      const imageFilePath = path.join(__dirname, "mock_image.png")
      const image = fs.readFileSync(imageFilePath)

      await api
        .put(`/api/presentation/${testPresentationId}`)
        .attach("image", image, "mock_image.png")
        .field("index", "1")
        .field("cueName", "Test Cue")
        .field("screen", "5") // Invalid screen
        .field("fileName", "")
        .expect(400)
    })

    test("Create cue with missing name field", async () => {
      const imageFilePath = path.join(__dirname, "mock_image.png")
      const image = fs.readFileSync(imageFilePath)

      await api
        .put(`/api/presentation/${testPresentationId}`)
        .attach("image", image, "mock_image.png")
        .field("index", "1")
        .field("screen", "5")
        // Missing name field
        .field("fileName", "")
        .expect(400)
    })
  })

  describe("PUT /api/presentation/:id/:cueId - Cue Updates", () => {
    let testCue
    let testCueId

    // Create a cue for update test group
    beforeEach(async () => {
      testCue = await createCue(2) // Cue is created in screen 2
      testCueId = testCue._id
    })

    test("Update existing cue with valid screen 1", async () => {
      await api
        .put(`/api/presentation/${testPresentationId}/${testCueId}`)
        .field("index", "1")
        .field("cueName", "Test Cue")
        .field("screen", "1") // Valid screen
        .field("fileName", "")
        .expect(200)
    })

    test("Update existing cue with valid screen 4", async () => {
      await api
        .put(`/api/presentation/${testPresentationId}/${testCueId}`)
        .field("index", "1")
        .field("cueName", "Test Cue")
        .field("screen", "4") // Valid screen
        .field("fileName", "")
        .expect(200)
    })

    test("Update existing cue with invalid screen 0", async () => {
      await api
        .put(`/api/presentation/${testPresentationId}/${testCueId}`)
        .field("index", "1")
        .field("cueName", "Test Cue")
        .field("screen", "0") // Invalid screen
        .field("fileName", "")
        .expect(400)
    })

    test("Update existing cue with invalid screen 5", async () => {
      await api
        .put(`/api/presentation/${testPresentationId}/${testCueId}`)
        .field("index", "1")
        .field("cueName", "Test Cue")
        .field("screen", "5") // Invalid screen
        .field("fileName", "")
        .expect(400)
    })

    test("Update existing cue with missing fields", async () => {
      await api
        .put(`/api/presentation/${testPresentationId}/${testCueId}`)
        .field("index", "1") // Missing required fields
        .field("fileName", "")
        .expect(400)
    })
  })
})
