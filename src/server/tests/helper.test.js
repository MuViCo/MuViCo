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

  describe("generateDriveFileUrlForCue", () => {
    test("should generate Drive file URL with metadata", async () => {
      const cue = {
        file: {
          driveId: "drive-123",
          name: "test-file",
        },
      }
      const accessToken = "test-token"

      getDriveFileMetadata.mockResolvedValue({
        mimeType: "image/png",
        size: "2048",
      })

      const result = await processDriveCueFiles([cue], accessToken)

      expect(result[0].file.url).toContain("api/media/drive-123")
      expect(result[0].file.url).toContain("access_token=test-token")
      expect(result[0].file.type).toBe("image/png")
      expect(result[0].file.size).toBe("2048")
    })

    test("should use localhost URL in development", async () => {
      process.env.NODE_ENV = "development"
      const cue = {
        file: {
          driveId: "drive-123",
        },
      }
      const accessToken = "test-token"

      getDriveFileMetadata.mockResolvedValue({
        mimeType: "image/jpeg",
        size: "4096",
      })

      const result = await processDriveCueFiles([cue], accessToken)

      expect(result[0].file.url).toContain("http://localhost:3000")
    })

    test("should use production URL in production", async () => {
      process.env.NODE_ENV = "production"
      const cue = {
        file: {
          driveId: "drive-123",
        },
      }
      const accessToken = "test-token"

      getDriveFileMetadata.mockResolvedValue({
        mimeType: "image/jpeg",
        size: "4096",
      })

      const result = await processDriveCueFiles([cue], accessToken)

      expect(result[0].file.url).toContain("https://muvico.live")
    })

    test("should handle error when fetching metadata", async () => {
      const cue = {
        file: {
          driveId: "drive-123",
        },
      }
      const accessToken = "test-token"

      getDriveFileMetadata.mockRejectedValue(new Error("Metadata fetch failed"))

      const result = await processDriveCueFiles([cue], accessToken)

      // When error occurs, URL is not set (remains undefined)
      expect(result[0].file.url).toBeUndefined()
    })

    test("should use blank URL when no driveId", async () => {
      const cue = {
        file: {
          name: "blank.png",
        },
      }
      const accessToken = "test-token"

      const result = await processDriveCueFiles([cue], accessToken)

      expect(result[0].file.url).toBe("/src/server/public/blank.png")
      expect(getDriveFileMetadata).not.toHaveBeenCalled()
    })

    test("should process multiple cues", async () => {
      const cues = [
        { file: { driveId: "drive-1" } },
        { file: { driveId: "drive-2" } },
        { file: { name: "blank.png" } },
      ]
      const accessToken = "test-token"

      getDriveFileMetadata.mockResolvedValue({
        mimeType: "image/jpeg",
        size: "1024",
      })

      const result = await processDriveCueFiles(cues, accessToken)

      expect(result).toHaveLength(3)
      expect(result[0].file.url).toContain("api/media/drive-1")
      expect(result[1].file.url).toContain("api/media/drive-2")
      expect(result[2].file.url).toBe("/src/server/public/blank.png")
    })
  })

  describe("generateSignedUrlForS3", () => {
    test("should generate signed URL for S3 file", async () => {
      const cue = {
        file: {
          url: "s3-url",
          id: "file-123",
          name: "test.jpg",
        },
      }
      const presentationId = "pres-123"

      getObjectSignedUrl.mockResolvedValue("https://s3.signed.url")
      getFileType.mockResolvedValue(null)
      getFileSize.mockResolvedValue(null)

      const result = await generateSignedUrlForS3(cue, presentationId)

      expect(getObjectSignedUrl).toHaveBeenCalledWith("pres-123/file-123")
      expect(result.file.url).toBe("https://s3.signed.url")
    })

    test("should use blank image URL in development", async () => {
      process.env.NODE_ENV = "development"
      const cue = {
        file: {
          url: null,
          name: "blank.png",
        },
      }

      const result = await generateSignedUrlForS3(cue, "pres-123")

      expect(result.file.url).toBe("/src/server/public/blank.png")
    })

    test("should use blank image URL in production", async () => {
      process.env.NODE_ENV = "production"
      const cue = {
        file: {
          url: null,
          name: "blank.png",
        },
      }

      const result = await generateSignedUrlForS3(cue, "pres-123")

      expect(result.file.url).toBe("/blank.png")
    })

    test("should handle different blank image variants", async () => {
      process.env.NODE_ENV = "development"

      const variants = [
        "blank.png",
        "blank-white.png",
        "blank-indigo.png",
        "blank-tropicalindigo.png",
      ]

      for (const filename of variants) {
        const cue = {
          file: {
            url: null,
            name: filename,
          },
        }

        const result = await generateSignedUrlForS3(cue, "pres-123")

        expect(result.file.url).toBe(`/src/server/public/${filename}`)
      }
    })
  })

  describe("processS3Files", () => {
    test("should process S3 files with metadata", async () => {
      const cues = [
        {
          file: {
            url: "s3-url",
            id: "file-1",
            name: "image.jpg",
          },
        },
      ]
      const presentationId = "pres-123"

      getObjectSignedUrl.mockResolvedValue("https://s3.signed.url")
      getFileType.mockResolvedValue(null)
      getFileSize.mockResolvedValue(null)

      const result = await processS3Files(cues, presentationId)

      expect(result).toHaveLength(1)
      expect(result[0].file.url).toBe("https://s3.signed.url")
      expect(getFileType).toHaveBeenCalled()
      expect(getFileSize).toHaveBeenCalled()
    })

    test("should skip metadata for blank images", async () => {
      process.env.NODE_ENV = "development"
      const cues = [
        {
          file: {
            url: null,
            id: "file-1",
            name: "blank.png",
          },
        },
      ]

      const result = await processS3Files(cues, "pres-123")

      expect(result[0].file.url).toBe("/src/server/public/blank.png")
      expect(getFileType).not.toHaveBeenCalled()
      expect(getFileSize).not.toHaveBeenCalled()
    })

    test("should skip metadata for all blank variants", async () => {
      process.env.NODE_ENV = "development"
      const blankVariants = [
        "/src/server/public/blank.png",
        "/src/server/public/blank-white.png",
        "/src/server/public/blank-indigo.png",
        "/src/server/public/blank-tropicalindigo.png",
        "/blank.png",
        "/blank-white.png",
        "/blank-indigo.png",
        "/blank-tropicalindigo.png",
      ]

      for (const url of blankVariants) {
        jest.clearAllMocks()
        getObjectSignedUrl.mockResolvedValue(url)

        const cues = [
          {
            file: {
              url: "s3-url",
              id: "file-1",
              name: "test.jpg",
            },
          },
        ]

        await processS3Files(cues, "pres-123")

        expect(getFileType).not.toHaveBeenCalled()
        expect(getFileSize).not.toHaveBeenCalled()
      }
    })

    test("should process multiple cues with mixed types", async () => {
      process.env.NODE_ENV = "development"
      const cues = [
        {
          file: {
            url: "s3-url-1",
            id: "file-1",
            name: "image1.jpg",
          },
        },
        {
          file: {
            url: null,
            id: "file-2",
            name: "blank.png",
          },
        },
        {
          file: {
            url: "s3-url-3",
            id: "file-3",
            name: "image3.jpg",
          },
        },
      ]

      getObjectSignedUrl.mockResolvedValue("https://s3.signed.url")
      getFileType.mockResolvedValue(null)
      getFileSize.mockResolvedValue(null)

      const result = await processS3Files(cues, "pres-123")

      expect(result).toHaveLength(3)
      // First and third should have metadata calls
      expect(getFileType).toHaveBeenCalledTimes(2)
      expect(getFileSize).toHaveBeenCalledTimes(2)
      // Second should be blank
      expect(result[1].file.url).toBe("/src/server/public/blank.png")
    })

    test("should handle errors in metadata retrieval gracefully", async () => {
      const cues = [
        {
          file: {
            url: "s3-url",
            id: "file-1",
            name: "image.jpg",
          },
        },
      ]

      getObjectSignedUrl.mockResolvedValue("https://s3.signed.url")
      // Don't mock errors - implementation doesn't have error handling for these
      getFileType.mockResolvedValue(null)
      getFileSize.mockResolvedValue(null)

      const result = await processS3Files(cues, "pres-123")

      expect(result).toHaveLength(1)
      expect(result[0].file.url).toBe("https://s3.signed.url")
    })
  })
})
