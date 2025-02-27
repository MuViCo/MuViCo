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
let testCueId

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
  const createCue = async (
    index,
    cueName,
    screen,
    isInitialElement = false
  ) => {
    const imageFilePath = path.join(__dirname, "mock_image.png")
    const image = fs.readFileSync(imageFilePath)

    const url = isInitialElement
      ? `/api/presentation/${testPresentationId}?isInitialElement=true`
      : `/api/presentation/${testPresentationId}`

    const response = await api
      .put(url)
      .attach("image", image, "mock_image.png")
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

  describe("Cue creation tests", () => {
    test("PUT /api/presentation/:id with valid inputs should return 200", async () => {
      const response = await createCue(1, "Test Cue", 1)
      expect(response.status).toBe(200)
    })

    test("PUT /api/presentation/:id with invalid screen should return 400", async () => {
      const response = await createCue(1, "Test Cue", 5)
      expect(response.status).toBe(400)
      expect(response.body.error).toBe(
        "Invalid cue screen: 5. Screen must be between 1 and 4."
      )
    })

    test("PUT /api/presentation/:id with invalid index should return 400", async () => {
      const response = await createCue(101, "Test Cue", 4)
      expect(response.status).toBe(400)
      expect(response.body.error).toBe(
        "Invalid cue index: 101. Index must be between 1 and 100."
      )
    })

    test("PUT /api/presentation/:id with missing screen should return 400", async () => {
      const response = await api
        .put(`/api/presentation/${testPresentationId}`)
        .field("index", "1")
        .field("cueName", "Test Cue")
        .field("fileName", "")
        .expect(400)

      expect(response.body.error).toBe("Missing required fields")
    })
  })

  describe("Cue updation tests", () => {
    test("PUT /api/presentation/:id/:cueId with valid inputs should return 200", async () => {
      testCueId = (await createCue(1, "Test Cue", 2)).body.cues[0]._id

      await api
        .put(`/api/presentation/${testPresentationId}/${testCueId}`)
        .field("index", "100")
        .field("cueName", "Test Cue")
        .field("screen", "4")
        .field("fileName", "")
        .expect(200)
    })

    test("PUT /api/presentation/:id/:cueId with invalid screen should return 400", async () => {
      testCueId = (await createCue(1, "Test Cue", 2)).body.cues[0]._id

      const response = await api
        .put(`/api/presentation/${testPresentationId}/${testCueId}`)
        .field("index", "1")
        .field("cueName", "Test Cue")
        .field("screen", "5")
        .field("fileName", "")
        .expect(400)

      expect(response.body.error).toBe(
        "Invalid cue screen: 5. Screen must be between 1 and 4."
      )
    })

    test("PUT /api/presentation/:id/:cueId with invalid index should return 400", async () => {
      testCueId = (await createCue(1, "Test Cue", 2)).body.cues[0]._id

      const response = await api
        .put(`/api/presentation/${testPresentationId}/${testCueId}`)
        .field("index", "0")
        .field("cueName", "Test Cue")
        .field("screen", "4")
        .field("fileName", "")
        .expect(400)

      expect(response.body.error).toBe(
        "Invalid cue index: 0. Index must be between 1 and 100."
      )
    })
  })

  describe("Initial element tests", () => {
    test("PUT /api/presentation/:id with 4 cues having index = 0 and isInitialElement = true should return 200", async () => {
      const screens = [1, 2, 3, 4]

      for (const screen of screens) {
        const response = await createCue(
          0,
          `initial element for screen ${screen}`,
          screen,
          true
        )
        expect(response.status).toBe(200)
      }

      // Fetch presentation to check stored cues
      const response = await api
        .get(`/api/presentation/${testPresentationId}`)
        .set("Authorization", authHeader)
        .expect(200)

      const { cues } = response.body

      // Ensure exactly 4 cues exist
      expect(cues.length).toBe(4)

      cues.forEach((cue, index) => {
        expect(cue.index).toBe(0)
        expect(cue.name).toBe(`initial element for screen ${screens[index]}`)
        expect(cue.screen).toBe(screens[index])
      })
    })

    test("PUT /api/presentation/:id with 4 cues having index = 0 without isInitialElement flag should return 400", async () => {
      const screens = [1, 2, 3, 4]

      for (const screen of screens) {
        const response = await createCue(
          0,
          `initial element for screen ${screen}`,
          screen
        )
        expect(response.status).toBe(400)
        expect(response.body.error).toBe(
          "Invalid cue index: 0. Index must be between 1 and 100."
        )
      }
    })
  })
})
