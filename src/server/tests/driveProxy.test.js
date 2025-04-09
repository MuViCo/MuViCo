jest.mock("../utils/drive", () => ({
  getDriveFileStream: jest.fn(),
}))

const supertest = require("supertest")
const mongoose = require("mongoose")
const app = require("../app")
const { getDriveFileStream } = require("../utils/drive")
const { beforeEach } = require("node:test")

const api = supertest(app)

describe("Drive API", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("returns 401 when access token is missing", async () => {
    const response = await api.get("/api/media/123456").expect(401)

    expect(response.text).toBe("Access token missing")
  })

  test("streams file when access token is provided", async () => {
    const mockFileStream = {
      pipe: jest.fn((res) => {
        res.end()
      }),
    }

    getDriveFileStream.mockResolvedValue(mockFileStream)

    await api
      .get("/api/media/123456")
      .query({ access_token: "valid_token" })
      .expect(200)

    expect(getDriveFileStream).toHaveBeenCalledWith("123456", "valid_token")
    expect(mockFileStream.pipe).toHaveBeenCalled()
  })

  test("catches error streaming file", async () => {
    getDriveFileStream.mockRejectedValue(new Error("Some error"))

    const response = await api
      .get("/api/media/123456")
      .query({ access_token: "valid_token" })
      .expect(500)

    expect(response.text).toBe("Error streaming file")
  })
})

afterAll(async () => {
  await mongoose.connection.close()
})
