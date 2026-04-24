/*
 * Helper utility tests.
 * Verifies Drive cue URL generation, S3 signed URL creation, and S3 metadata enrichment flows.
 */
const {
  processDriveCueFiles,
  generateSignedUrlForS3,
  processS3Files,
} = require("../utils/helper")
const { getDriveFileMetadata } = require("../utils/drive")
const { getObjectSignedUrl } = require("../utils/s3")
const { getFileSize, getFileType } = require("../utils/s3")

jest.mock("../utils/drive")
jest.mock("../utils/s3")

describe("Helper utility functions", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.NODE_ENV = "development"
  })

  describe("processDriveCueFiles", () => {
    test("generates Drive file URL with metadata", async () => {
      const cue = {
        file: {
          driveId: "drive-123",
          name: "test-file",
        },
      }

      getDriveFileMetadata.mockResolvedValue({
        mimeType: "image/png",
        size: "2048",
      })

      const result = await processDriveCueFiles([cue], "test-token")

      expect(result[0].file.url).toContain("api/media/drive-123")
      expect(result[0].file.url).toContain("access_token=test-token")
      expect(result[0].file.type).toBe("image/png")
      expect(result[0].file.size).toBe("2048")
    })

    test("uses localhost URL in development", async () => {
      process.env.NODE_ENV = "development"
      const cue = { file: { driveId: "drive-123" } }

      getDriveFileMetadata.mockResolvedValue({
        mimeType: "image/jpeg",
        size: "4096",
      })

      const result = await processDriveCueFiles([cue], "test-token")

      expect(result[0].file.url).toContain("http://localhost:3000")
    })

    test("uses production URL in production", async () => {
      process.env.NODE_ENV = "production"
      const cue = { file: { driveId: "drive-123" } }

      getDriveFileMetadata.mockResolvedValue({
        mimeType: "image/jpeg",
        size: "4096",
      })

      const result = await processDriveCueFiles([cue], "test-token")

      expect(result[0].file.url).toContain("https://muvico.live")
    })

    test("handles metadata fetch errors without crashing", async () => {
      global.console = { ...console, error: jest.fn() }
      const cue = { file: { driveId: "drive-123" } }

      getDriveFileMetadata.mockRejectedValue(new Error("Metadata fetch failed"))

      const result = await processDriveCueFiles([cue], "test-token")

      expect(result[0].file.url).toBeUndefined()
    })

    test("leaves file URL unchanged when cue has no driveId", async () => {
      const cue = { file: { name: "image.png", url: "existing-url" } }

      const result = await processDriveCueFiles([cue], "test-token")

      expect(result[0].file.url).toBe("existing-url")
      expect(getDriveFileMetadata).not.toHaveBeenCalled()
    })

    test("handles cues without files", async () => {
      const cue = { file: null }

      const result = await processDriveCueFiles([cue], "test-token")

      expect(result[0].file).toBeNull()
      expect(getDriveFileMetadata).not.toHaveBeenCalled()
    })

    test("processes multiple cues with mixed drive metadata", async () => {
      const cues = [
        { file: { driveId: "drive-1" } },
        { file: { driveId: "drive-2" } },
        { file: { name: "image.png", url: "existing-url" } },
      ]

      getDriveFileMetadata.mockResolvedValue({
        mimeType: "image/jpeg",
        size: "1024",
      })

      const result = await processDriveCueFiles(cues, "test-token")

      expect(result).toHaveLength(3)
      expect(result[0].file.url).toContain("api/media/drive-1")
      expect(result[1].file.url).toContain("api/media/drive-2")
      expect(result[2].file.url).toBe("existing-url")
      expect(getDriveFileMetadata).toHaveBeenCalledTimes(2)
    })
  })

  describe("generateSignedUrlForS3", () => {
    test("generates signed URL when file id exists", async () => {
      const cue = {
        file: {
          id: "file-123",
          name: "test.jpg",
          url: "",
        },
      }

      getObjectSignedUrl.mockResolvedValue("https://s3.signed.url")

      const result = await generateSignedUrlForS3(cue, "pres-123")

      expect(getObjectSignedUrl).toHaveBeenCalledWith("pres-123/file-123")
      expect(result.file.url).toBe("https://s3.signed.url")
    })

    test("does nothing when file id is missing", async () => {
      const cue = {
        file: {
          name: "test.jpg",
          url: "",
        },
      }

      const result = await generateSignedUrlForS3(cue, "pres-123")

      expect(result.file.url).toBe("")
      expect(getObjectSignedUrl).not.toHaveBeenCalled()
    })
  })

  describe("processS3Files", () => {
    test("processes S3 files and enriches metadata", async () => {
      const cues = [
        {
          file: {
            id: "file-1",
            name: "image.jpg",
            url: "",
          },
        },
      ]

      getObjectSignedUrl.mockResolvedValue("https://s3.signed.url")
      getFileType.mockResolvedValue(null)
      getFileSize.mockResolvedValue(null)

      const result = await processS3Files(cues, "pres-123")

      expect(result).toHaveLength(1)
      expect(result[0].file.url).toBe("https://s3.signed.url")
      expect(getFileType).toHaveBeenCalledTimes(1)
      expect(getFileSize).toHaveBeenCalledTimes(1)
    })

    test("skips cues without files", async () => {
      const cues = [{ file: null }, { name: "no-file-cue" }]

      const result = await processS3Files(cues, "pres-123")

      expect(result).toHaveLength(2)
      expect(getObjectSignedUrl).not.toHaveBeenCalled()
      expect(getFileType).not.toHaveBeenCalled()
      expect(getFileSize).not.toHaveBeenCalled()
    })

    test("skips metadata enrichment when signed URL is missing", async () => {
      const cues = [
        {
          file: {
            id: "file-1",
            name: "image.jpg",
            url: "",
          },
        },
      ]

      getObjectSignedUrl.mockResolvedValue("")

      await processS3Files(cues, "pres-123")

      expect(getFileType).not.toHaveBeenCalled()
      expect(getFileSize).not.toHaveBeenCalled()
    })

    test("processes mixed cue list consistently", async () => {
      const cues = [
        {
          file: {
            id: "file-1",
            name: "image1.jpg",
            url: "",
          },
        },
        {
          file: null,
        },
        {
          file: {
            id: "file-3",
            name: "image3.jpg",
            url: "",
          },
        },
      ]

      getObjectSignedUrl.mockResolvedValue("https://s3.signed.url")
      getFileType.mockResolvedValue(null)
      getFileSize.mockResolvedValue(null)

      const result = await processS3Files(cues, "pres-123")

      expect(result).toHaveLength(3)
      expect(getFileType).toHaveBeenCalledTimes(2)
      expect(getFileSize).toHaveBeenCalledTimes(2)
    })
  })
})
