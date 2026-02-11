const supertest = require("supertest")
const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const config = require("../utils/config")
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
      .send({ name: "Test presentation", screenCount: 4 })
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
      .set("Authorization", authHeader)
      .attach("image", mockImageBuffer, "mock_image.png")
      .field("index", index)
      .field("cueName", cueName)
      .field("screen", screen)
      .field("fileName", "")

    return response
  }

  const setIndexCount = async (id, indexCount) => {
    if (!testPresentationId) {
      throw new Error("Error in setIndexCount: testPresentationId is undefined")
    }

    const url = `/api/presentation/${id}/indexCount`

    const response = await api
      .put(url)
      .set("Authorization", authHeader)
      .send({ id: id, indexCount: indexCount })

    return response
  }

  describe("GET /api/presentation/:id", () => {
    test("presentation is returned as json when using amazon s3", async () => {
      await api
        .get(`/api/presentation/${testPresentationId}`)
        .set("Authorization", authHeader)
        .expect(200)
        .expect("Content-Type", /application\/json/)
    })
    test("presentation is returned as json when using google drive", async () => {
      const user = await User.findOne({
        username: "testuser",
      })
      user.driveToken = "test-drive-token"
      await user.save()

      await api
        .get(`/api/presentation/${testPresentationId}`)
        .set("Authorization", authHeader)
        .expect(200)
        .expect("Content-Type", /application\/json/)
    })
  })
  describe("DELETE", () => {
    test(" /api/presentation/:id", async () => {
      await api
        .delete(`/api/presentation/${testPresentationId}`)
        .set("Authorization", authHeader)
        .expect(204)
    })
  })

  describe("Test error handling", () => {
    it("GET /api/presentation/:id with no user should return 401", async () => {
      const response = await api.get(
        "/api/presentation/000000000000000000000000"
      )

      expect(response.status).toBe(401)
    })

    it("GET /api/presentation/:id with invalid ID should return 404", async () => {
      const response = await api
        .get("/api/presentation/000000000000000000000000")
        .set("Authorization", authHeader)

      expect(response.status).toBe(404)
    })

    it("GET /api/presentation/:id with invalid path should return 400", async () => {
      const response = await api
        .get("/api/presentation/invalid-id-format")
        .set("Authorization", authHeader)

      expect(response.status).toBe(400)
      expect(response.body.error).toBe("malformatted id")
    })

    it("DELETE /api/presentation/:id with invalid ID should return 404", async () => {
      const response = await api
        .delete("/api/presentation/000000000000000000000000")
        .set("Authorization", authHeader)

      expect(response.status).toBe(404)
      expect(response.body.error).toBe("presentation not found")
    })

    it("PUT /api/presentation/:id with missing required fields should return 400", async () => {
      const response = await api
        .put("/api/presentation/:id")
        .set("Authorization", authHeader)

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
      [0, 0, "Invalid cue screen: 0. Screen must be between 1 and 5."],
      [1, 6, "Invalid cue screen: 6. Screen must be between 1 and 5."],
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
        .set("Authorization", authHeader)
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
      [3, 2],
      [4, 4],
    ]

    test.each(validCases)(
      "updates cue with valid data (index=%i, screen=%i)",
      async (index, screen) => {
        await api
          .put(`/api/presentation/${testPresentationId}/${testCueId}`)
          .set("Authorization", authHeader)
          .field("index", index)
          .field("cueName", "Updated Test Cue")
          .field("screen", screen)
          .field("fileName", "")
          .expect(200)
      }
    )

    const invalidCases = [
      [-1, 1, "Invalid cue index: -1. Index must be between 0 and 4."],
      [5, 4, "Invalid cue index: 5. Index must be between 0 and 4."],
      [0, 0, "Invalid cue screen: 0. Screen must be between 1 and 5."],
      [0, 6, "Invalid cue screen: 6. Screen must be between 1 and 5."],
    ]

    test.each(invalidCases)(
      "throws error with invalid data (index=%i, screen=%i)",
      async (index, screen, error) => {
        const response = await api
          .put(`/api/presentation/${testPresentationId}/${testCueId}`)
          .set("Authorization", authHeader)
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
        .set("Authorization", authHeader)
        .field("index", "1")
        .field("fileName", "")
        .expect(400)

      expect(response.body.error).toBe("Missing required fields")
    })
  })

  describe("PUT /api/presentation/:id/indexCount", () => {
    const validCases = [1, 5, 10, 100]

    test.each(validCases)(
      "updates indexCount with valid count %i",
      async (indexCount) => {
        const response = await setIndexCount(testPresentationId, indexCount)
        expect(response.status).toBe(200)
      }
    )

    const invalidCases = [
      [0, "indexCount must be between 1 and 100"],
      [101, "indexCount must be between 1 and 100"],
      ["asdf", "indexCount must be a number"]
    ]

    test.each(invalidCases)(
      "throws error with invalid index count %s",
      async (indexCount, error) => {
        const response = await setIndexCount(testPresentationId, indexCount)
        expect(response.status).toBe(400)
        expect(response.body.error).toBe(error)
      }
    )

    test("throws 400 with missing id", async () => {
      const response = await setIndexCount(null, 5)
      expect(response.status).toBe(400)
      expect(response.body.error).toBe("malformatted id")
    })
  })

  describe("PUT /api/presentation/:id/screenCount", () => {
    beforeEach(async () => {
      const user = await User.findOne({ username: "testuser" })
      if (!user) {
        throw new Error("Test user not found in screen count tests")
      }

      const presentation = new Presentation({
        name: "Screen Count Test Presentation",
        user: user._id,
        screenCount: 3,
        cues: [
          { screen: 1, index: 1, name: "Element 1-1" },
          { screen: 1, index: 2, name: "Element 1-2" },
          { screen: 2, index: 1, name: "Element 2-1" },
          { screen: 3, index: 1, name: "Element 3-1" },
          { screen: 3, index: 2, name: "Element 3-2" },
          { screen: 3, index: 3, name: "Element 3-3" }
        ]
      })
      await presentation.save()
      testPresentationId = presentation._id
    })

    test("Should increase screen count and add initial elements", async () => {
      const response = await api
        .put(`/api/presentation/${testPresentationId}/screenCount`)
        .set("Authorization", authHeader)
        .send({ screenCount: 4 })
        .expect(200)

      expect(response.body.screenCount).toBe(4)
      expect(response.body.removedCuesCount).toBe(0)

      // Verify the presentation was updated
      const updatedPresentation = await Presentation.findById(testPresentationId)
      expect(updatedPresentation.screenCount).toBe(4)
      
      // Check that the presentation has the same number of cues (no automatic new cues added)
      expect(updatedPresentation.cues.length).toBe(6)
    })

    test("Should decrease screen count and remove cues from removed screens", async () => {
      const response = await api
        .put(`/api/presentation/${testPresentationId}/screenCount`)
        .set("Authorization", authHeader)
        .send({ screenCount: 2 })
        .expect(200)

      expect(response.body.screenCount).toBe(2)
      expect(response.body.removedCuesCount).toBe(3)

      const updatedPresentation = await Presentation.findById(testPresentationId)
      expect(updatedPresentation.screenCount).toBe(2)

      const screen3Cues = updatedPresentation.cues.filter(cue => cue.screen === 3)
      expect(screen3Cues.length).toBe(0)
      
      const remainingCues = updatedPresentation.cues
      expect(remainingCues.filter(cue => cue.screen === 1).length).toBe(2)
      expect(remainingCues.filter(cue => cue.screen === 2).length).toBe(1)
    })

    test("Should reject invalid screen count (too low)", async () => {
      const response = await api
        .put(`/api/presentation/${testPresentationId}/screenCount`)
        .set("Authorization", authHeader)
        .send({ screenCount: 0 })
        .expect(400)

      expect(response.body.error).toBe("screenCount must be between 1 and 8")
    })

    test("Should reject invalid screen count (too high)", async () => {
      const response = await api
        .put(`/api/presentation/${testPresentationId}/screenCount`)
        .set("Authorization", authHeader)
        .send({ screenCount: 9 })
        .expect(400)

      expect(response.body.error).toBe("screenCount must be between 1 and 8")
    })

    test("Should accept non-integer screen count (API converts to integer)", async () => {
      const response = await api
        .put(`/api/presentation/${testPresentationId}/screenCount`)
        .set("Authorization", authHeader)
        .send({ screenCount: 2.2 })
        .expect(200)

      expect(response.body.screenCount).toBe(2) 
    })

    test("Should reject missing screen count", async () => {
      const response = await api
        .put(`/api/presentation/${testPresentationId}/screenCount`)
        .set("Authorization", authHeader)
        .send({})
        .expect(400)

      expect(response.body.error).toBe("screenCount must be a number")
    })

    test("Should handle setting same screen count (no change)", async () => {
      const response = await api
        .put(`/api/presentation/${testPresentationId}/screenCount`)
        .set("Authorization", authHeader)
        .send({ screenCount: 3 })
        .expect(200)

      expect(response.body.screenCount).toBe(3)
      expect(response.body.removedCuesCount).toBe(0)

      const updatedPresentation = await Presentation.findById(testPresentationId)
      expect(updatedPresentation.cues.length).toBe(6) // Original count
    })

    test("Should not work without authorization", async () => {
      const response = await api
        .put(`/api/presentation/${testPresentationId}/screenCount`)
        .send({ screenCount: 2 })
        .expect(401)
      
      expect(response.body.error).toBe("authentication required")
    })

    test("Should reject access to non-existent presentation", async () => {
      const fakeId = new mongoose.Types.ObjectId()
      const response = await api
        .put(`/api/presentation/${fakeId}/screenCount`)
        .set("Authorization", authHeader)
        .send({ screenCount: 2 })
        .expect(404)

      expect(response.body.error).toBe("presentation not found")
    })

    test("Should not allow access regardless of user", async () => {
      // Create another user
      const otherUser = new User({
        email: "other@example.com",
        hashedPassword: await bcrypt.hash("password123", 10),
        username: "otheruser"
      })
      await otherUser.save()

      const otherToken = jwt.sign({ id: otherUser._id }, config.SECRET)

      const response = await api
        .put(`/api/presentation/${testPresentationId}/screenCount`)
        .set("Authorization", `Bearer ${otherToken}`)
        .send({ screenCount: 2 })
        .expect(403)

      expect(response.body.error).toBe("access denied")
    })
  })

  describe("PUT /api/presentation/:id/shiftIndexes", () => {
    beforeEach(async () => {
      const user = await User.findOne({ username: "testuser" })
      if (!user) {
        throw new Error("Test user not found in screen count tests")
      }

      const presentation = new Presentation({
        name: "Screen Count Test Presentation",
        user: user._id,
        screenCount: 3,
        cues: []
      })
      await presentation.save()
      testPresentationId = presentation._id
      await setIndexCount(testPresentationId, 6)
      
      await createCue(0, "First Cue", 1)
      await createCue(2, "Second Cue", 1)
      await createCue(4, "Third Cue", 1)
    })

    test("Should shift indices right successfully", async () => {
      const response = await api
        .put(`/api/presentation/${testPresentationId}/shiftIndexes`)
        .set("Authorization", authHeader)
        .send({ startIndex: 0, direction: "right" })
        .expect(200)

      expect(response.body.shifted).toBe(true)

      const presentation = await Presentation.findById(testPresentationId)
      const cues = presentation.cues
      const first = cues.find(c => c.name === "First Cue")
      const second = cues.find(c => c.name === "Second Cue")
      const third = cues.find(c => c.name === "Third Cue")
      expect(first).toBeDefined()
      expect(second).toBeDefined()
      expect(third).toBeDefined()
      expect(first.index).toBe(0)
      expect(second.index).toBe(3)
      expect(third.index).toBe(5)
    })

    test("Should shift indices left successfully", async () => {
      const response = await api
        .put(`/api/presentation/${testPresentationId}/shiftIndexes`)
        .set("Authorization", authHeader)
        .send({ startIndex: 2, direction: "left" })
        .expect(200)

      expect(response.body.shifted).toBe(true)

      const presentation = await Presentation.findById(testPresentationId)
      const cues = presentation.cues
      const first = cues.find(c => c.name === "First Cue")
      const second = cues.find(c => c.name === "Second Cue")
      const third = cues.find(c => c.name === "Third Cue")
      expect(first).toBeDefined()
      expect(second).toBeDefined()
      expect(third).toBeDefined()
      expect(first.index).toBe(0)
      expect(second.index).toBe(2)
      expect(third.index).toBe(3)
    })

    test("Should fail with invalid direction", async () => {
      const response = await api
        .put(`/api/presentation/${testPresentationId}/shiftIndexes`)
        .set("Authorization", authHeader)
        .send({ startIndex: 1, direction: "invalid" })
        .expect(400)

      expect(response.body.error).toBe("Invalid parameters")
    })

    test("Should fail with missing startIndex", async () => {
      const response = await api
        .put(`/api/presentation/${testPresentationId}/shiftIndexes`)
        .set("Authorization", authHeader)
        .send({ direction: "right" })
        .expect(400)

      expect(response.body.error).toBe("Invalid parameters")
    })

    test("Should fail with missing direction", async () => {
      const response = await api
        .put(`/api/presentation/${testPresentationId}/shiftIndexes`)
        .set("Authorization", authHeader)
        .send({ startIndex: 1 })
        .expect(400)

      expect(response.body.error).toBe("Invalid parameters")
    })

    test("Should handle invalid presentation ID", async () => {
      const fakeId = new mongoose.Types.ObjectId()
      const response = await api
        .put(`/api/presentation/${fakeId}/shiftIndexes`)
        .set("Authorization", authHeader)
        .send({ startIndex: 1, direction: "right" })
        .expect(404)

      expect(response.body.error).toBe("presentation not found")
    })

    test("Should not work without authorization", async () => {
      const response = await api
        .put(`/api/presentation/${testPresentationId}/shiftIndexes`)
        .send({ startIndex: 1, direction: "right" })
        .expect(401)

      expect(response.body.error).toBe("authentication required")
    })

    test("Should return 400 with invalid id", async () => {
      const response = await api
        .put(`/api/presentation/invalid-id/shiftIndexes`)
        .set("Authorization", authHeader)
        .send({ startIndex: 1, direction: "right" })
        .expect(400)

      expect(response.body.error).toBe("malformatted id")
    })
  })

  describe("PUT /api/presentation/:id/name", () => {
    test("Should update presentation name successfully", async () => {
      const newName = "Updated Presentation Name"
      const response = await api
        .put(`/api/presentation/${testPresentationId}/name`)
        .set("Authorization", authHeader)
        .send({ name: newName })
        .expect(200)

      expect(response.body.name).toBe(newName)

      const presentation = await Presentation.findById(testPresentationId)
      expect(presentation.name).toBe(newName)
    })

    test("Should trim whitespace from presentation name", async () => {
      const response = await api
        .put(`/api/presentation/${testPresentationId}/name`)
        .set("Authorization", authHeader)
        .send({ name: "  Trimmed Name  " })
        .expect(200)

      expect(response.body.name).toBe("Trimmed Name")
    })

    test("Should fail with missing name", async () => {
      const response = await api
        .put(`/api/presentation/${testPresentationId}/name`)
        .set("Authorization", authHeader)
        .send({})
        .expect(400)

      expect(response.body.error).toBe("Presentation name must be a string")
    })

    test("Should respond with 404 when presentation not found", async () => {
      const fakeId = new mongoose.Types.ObjectId()
      const response = await api
        .put(`/api/presentation/${fakeId}/name`)
        .set("Authorization", authHeader)
        .send({ name: "New Name" })
        .expect(404)

      expect(response.body.error).toBe("presentation not found")
    })
  })

  describe("Authorization checks", () => {
    let otherAuthHeader

    beforeEach(async () => {
      // Create another user
      await api
        .post("/api/signup")
        .send({ username: "otheruser", password: "otherpassword" })

      const response = await api
        .post("/api/login")
        .send({ username: "otheruser", password: "otherpassword" })

      otherAuthHeader = `Bearer ${response.body.token}`
    })

    test("Another user cannot edit presentation name", async () => {
      const response = await api
        .put(`/api/presentation/${testPresentationId}/name`)
        .set("Authorization", otherAuthHeader)
        .send({ name: "I should not be able to change this" })
        .expect(403)
      
      expect(response.body.error).toBe("access denied")
    })

    test("Another user cannot delete presentation", async () => {
      const response = await api
        .delete(`/api/presentation/${testPresentationId}`)
        .set("Authorization", otherAuthHeader)
        .expect(403)

      expect(response.body.error).toBe("access denied")
    })

    test("Another user cannot update screen count", async () => {
      const response = await api
        .put(`/api/presentation/${testPresentationId}/screenCount`)
        .set("Authorization", otherAuthHeader)
        .send({ screenCount: 2 })
        .expect(403)

      expect(response.body.error).toBe("access denied")
    })

    test("Another user cannot update index count", async () => {
      const response = await api
        .put(`/api/presentation/${testPresentationId}/indexCount`)
        .set("Authorization", otherAuthHeader)
        .send({ indexCount: 10 })
        .expect(403)

      expect(response.body.error).toBe("access denied")
    })
  })

  describe("Admin Access", () => {
    let adminToken

    beforeEach(async () => {
      // Create the admin user before each test in this block
      const adminUser = new User({
        username: "adminuser",
        passwordHash: await bcrypt.hash("password", 10),
        isAdmin: true
      })
      await adminUser.save()
      
      adminToken = jwt.sign({ id: adminUser._id }, config.SECRET)
    })

    test("Admin can access another user's presentation", async () => {
      await api
        .get(`/api/presentation/${testPresentationId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200)
    })

    test("Admin can modify another user's presentation", async () => {
      await api
        .put(`/api/presentation/${testPresentationId}/name`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Admin Edited Name" })
        .expect(200)
        
       const updatedPresentation = await Presentation.findById(testPresentationId)
       expect(updatedPresentation.name).toBe("Admin Edited Name")
    })
  })
})

describe("MRU (Most Recently Used) sorting", () => {
  let user
  let presentation1
  let presentation2
  let presentation3
  let authHeader

  beforeEach(async () => {
    // Create test user
    user = new User({
      username: "testuser1",
      passwordHash: await bcrypt.hash("testpassword", 10),
    })
    await user.save()

    // Create test presentations
    presentation1 = new Presentation({
      name: "Presentation 1",
      user: user.id,
    })
    await presentation1.save()

    presentation2 = new Presentation({
      name: "Presentation 2",
      user: user.id,  
    })
    await presentation2.save()

    presentation3 = new Presentation({
      name: "Presentation 3",
      user: user.id,  
    })
    await presentation3.save()


    // Login and get auth token
    const loginRes = await api
      .post("/api/login")
      .send({ username: "testuser1", password: "testpassword" })

    authHeader = `Bearer ${loginRes.body.token}`
  })

  afterEach(async () => {
    await User.deleteMany({})
    await Presentation.deleteMany({})
  })

  test("lastUsed is updated when presentation is accessed", async () => {
    const beforeTime = new Date()

    await api
      .get(`/api/presentation/${presentation1.id}`)
      .set("Authorization", authHeader)
      .expect(200)

    const updatedPresentation = await Presentation.findById(presentation1.id)
    const afterTime = new Date()

    expect(updatedPresentation.lastUsed).toBeDefined()
    expect(updatedPresentation.lastUsed.getTime()).toBeGreaterThanOrEqual(
      beforeTime.getTime()
    )
    expect(updatedPresentation.lastUsed.getTime()).toBeLessThanOrEqual(
      afterTime.getTime()
    )
  })

  test("presentations are sorted by lastUsed in descending order", async () => {
    // Access presentations in order: 1, 2, 3
    const response1 = await api
      .get(`/api/presentation/${presentation1.id}`)
      .set("Authorization", authHeader)
      .expect(200)

    // Add small delay to ensure different timestamps
    await new Promise((resolve) => setTimeout(resolve, 100))

    const response2 =  await api
      .get(`/api/presentation/${presentation2.id}`)
      .set("Authorization", authHeader)
      .expect(200)

    await new Promise((resolve) => setTimeout(resolve, 100))

    await api
      .get(`/api/presentation/${presentation3.id}`)
      .set("Authorization", authHeader)
      .expect(200)

    // Fetch presentations list
    const response = await api
      .get("/api/home")
      .set("Authorization", authHeader)
      .expect(200)

    // Should be in order: 3, 2, 1 (most recently used first)
    expect(response.body[0].id).toBe(presentation3.id)
    expect(response.body[1].id).toBe(presentation2.id)
    expect(response.body[2].id).toBe(presentation1.id)
  })

  test("recently used presentation moves to top", async () => {
    // Access all presentations
    await api
      .get(`/api/presentation/${presentation1.id}`)
      .set("Authorization", authHeader)
      .expect(200)

    await new Promise((resolve) => setTimeout(resolve, 100))

    await api
      .get(`/api/presentation/${presentation2.id}`)
      .set("Authorization", authHeader)
      .expect(200)

    await new Promise((resolve) => setTimeout(resolve, 100))

    await api
      .get(`/api/presentation/${presentation3.id}`)
      .set("Authorization", authHeader)
      .expect(200)

    // Now access presentation1 again
    await new Promise((resolve) => setTimeout(resolve, 100))

    await api
      .get(`/api/presentation/${presentation1.id}`)
      .set("Authorization", authHeader)
      .expect(200)

    // Fetch presentations list again
    const response = await api
      .get("/api/home")
      .set("Authorization", authHeader)
      .expect(200)

    // presentation1 should now be at the top
    expect(response.body[0].id).toBe(presentation1.id)
    expect(response.body[1].id).toBe(presentation3.id)
    expect(response.body[2].id).toBe(presentation2.id)
  })

  test("createdAt and updatedAt are set correctly", async () => {
    const beforeCreate = new Date()

    const newPresentation = new Presentation({
      name: "New Presentation",
      user: user.id,
    })
    await newPresentation.save()

    const afterCreate = new Date()

    expect(newPresentation.createdAt).toBeDefined()
    expect(newPresentation.updatedAt).toBeDefined()
    expect(newPresentation.createdAt.getTime()).toBeGreaterThanOrEqual(
      beforeCreate.getTime()
    )
    expect(newPresentation.createdAt.getTime()).toBeLessThanOrEqual(
      afterCreate.getTime()
    )
    expect(newPresentation.updatedAt).toEqual(newPresentation.createdAt)
  })

  test("only current user's presentations are affected by MRU sorting", async () => {
    // Create another user
    const user2 = new User({
      username: "testuser2",
      passwordHash: await bcrypt.hash("testpassword", 10),
    })
    await user2.save()

    // Create presentation for user2
    const user2Presentation = new Presentation({
      name: "User2 Presentation",
      user: user2.id,
    })
    await user2Presentation.save()

    // Access user1's presentations
    await api
      .get(`/api/presentation/${presentation1.id}`)
      .set("Authorization", authHeader)
      .expect(200)

    // Fetch user1's presentations
    const user1Response = await api
      .get("/api/home")
      .set("Authorization", authHeader)
      .expect(200)

    // Should only contain user1's presentations
    expect(user1Response.body.length).toBe(3)
    expect(user1Response.body.every((p) => p.user === user.id.toString())).toBe(
      true
    )
  })
})

afterAll(async () => {
  await mongoose.connection.close()
})
