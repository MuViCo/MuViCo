const { Readable } = require("stream")
const { google } = require("googleapis")

const {
  driveAuth,
  getOrCreateMuViCoFolder,
  uploadDriveFile,
  deleteDriveFile,
  getDriveFileMetadata,
  getDriveFileStream,
} = require("../utils/drive")

const testAccessToken = "test-access-token"
const testRefreshToken = "test-refresh-token"
const testFileId = "test-file-id"
const testFolderId = "test-folder-id"
const testFileName = "test-file.jpeg"
const testMimeType = "image/jpeg"
const testFileBuffer = Buffer.from("test content")

jest.mock("googleapis", () => {
  const mockDrive = {
    files: {
      list: jest.fn(),
      create: jest.fn(),
      get: jest.fn(),
      delete: jest.fn(),
    },
    permissions: {
      create: jest.fn(),
    },
  }
  return {
    google: {
      drive: jest.fn().mockReturnValue(mockDrive),
    },
  }
})

jest.mock("google-auth-library", () => {
  return {
    OAuth2Client: jest.fn().mockImplementation(() => ({
      setCredentials: jest.fn(),
    })),
  }
})

jest.mock("stream", () => {
  return {
    ...jest.requireActual("stream"),
    Readable: {
      from: jest.fn().mockImplementation(() => "mocked-stream"),
    },
  }
})

describe("Drive API Utilities", () => {
  const mockDrive = google.drive()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("driveAuth", () => {
    it("should return a configured drive client", () => {
      const result = driveAuth(testAccessToken, testRefreshToken)

      expect(google.drive).toHaveBeenCalledWith({
        version: "v3",
        auth: expect.anything(),
      })

      expect(result).toBe(mockDrive)
    })
  })

  describe("getOrCreateMuViCoFolder", () => {
    it("should return existing folder id if folder exists", async () => {
      mockDrive.files.list.mockResolvedValueOnce({
        data: {
          files: [{ id: testFolderId, name: "MuViCo" }],
        },
      })

      const result = await getOrCreateMuViCoFolder(mockDrive)

      expect(mockDrive.files.list).toHaveBeenCalledWith({
        q: "mimeType = 'application/vnd.google-apps.folder' and name = 'MuViCo' and trashed = false",
        fields: "files(id, name)",
        spaces: "drive",
      })

      expect(result).toBe(testFolderId)
    })

    it("should create a new folder if it does not exist", async () => {
      mockDrive.files.list.mockResolvedValueOnce({
        data: {
          files: [],
        },
      })

      mockDrive.files.create.mockResolvedValueOnce({
        data: { id: testFolderId },
      })

      const result = await getOrCreateMuViCoFolder(mockDrive)

      expect(mockDrive.files.create).toHaveBeenCalledWith({
        requestBody: {
          name: "MuViCo",
          mimeType: "application/vnd.google-apps.folder",
        },
        fields: "id",
      })

      expect(result).toBe(testFolderId)
    })
  })

  describe("uploadDriveFile", () => {
    it("should upload file and set permissions", async () => {
      mockDrive.files.list.mockResolvedValueOnce({
        data: {
          files: [{ id: testFolderId }],
        },
      })

      mockDrive.files.create.mockResolvedValueOnce({
        data: { id: testFileId },
      })

      mockDrive.permissions.create.mockResolvedValueOnce({})

      const result = await uploadDriveFile(
        testFileBuffer,
        testFileName,
        testMimeType,
        testAccessToken
      )

      expect(mockDrive.files.create).toHaveBeenCalledWith({
        requestBody: {
          name: testFileName,
          mimeType: testMimeType,
          parents: [testFolderId],
        },
        media: {
          mimeType: testMimeType,
          body: "mocked-stream",
        },
        fields: "id",
      })

      expect(mockDrive.permissions.create).toHaveBeenCalledWith({
        fileId: testFileId,
        requestBody: {
          role: "reader",
          type: "anyone",
        },
      })

      expect(result).toEqual({ id: testFileId })
    })
    it("should throw error when upload fails", async () => {
      const testError = new Error("Upload failed")
      mockDrive.files.list.mockRejectedValueOnce(testError)

      await expect(
        uploadDriveFile(
          testFileBuffer,
          testFileName,
          testMimeType,
          testAccessToken
        )
      ).rejects.toThrow(testError)
    })
  })

  describe("deleteDriveFile", () => {
    it("should delete file succesfully", async () => {
      mockDrive.files.delete.mockResolvedValueOnce({})

      const result = await deleteDriveFile(testFileId, testAccessToken)

      expect(mockDrive.files.delete).toHaveBeenCalledWith({
        fileId: testFileId,
      })

      expect(result).toEqual({
        success: true,
        message: "File test-file-id deleted successfully.",
      })
    })
    it("should throw error when delete fails", async () => {
      const testError = new Error("Delete failed")
      mockDrive.files.delete.mockRejectedValueOnce(testError)

      await expect(
        deleteDriveFile(testFileId, testAccessToken)
      ).rejects.toThrow(testError)
    })
  })

  describe("getDriveFileMetaData", () => {
    it("should return file metadata", async () => {
      mockDrive.files.get.mockResolvedValueOnce({
        data: {
          id: testFileId,
          name: testFileName,
          mimeType: testMimeType,
          size: "1024",
        },
      })

      const result = await getDriveFileMetadata(testFileId, testAccessToken)

      expect(mockDrive.files.get).toHaveBeenCalledWith({
        fileId: testFileId,
        fields: "id, name, mimeType, size",
      })

      expect(result).toEqual({
        id: testFileId,
        name: testFileName,
        mimeType: testMimeType,
        size: "1024",
      })
    })
    it("should throw error when getting file metadata fails", async () => {
      const testError = new Error("Getting file metadata failed")
      mockDrive.files.get.mockRejectedValueOnce(testError)

      await expect(
        getDriveFileMetadata(testFileId, testAccessToken)
      ).rejects.toThrow(testError)
    })
  })

  describe("getFileStream", () => {
    it("should return file stream", async () => {
      const mockStream = "file-stream-data"
      mockDrive.files.get.mockResolvedValueOnce({
        data: mockStream,
      })

      const result = await getDriveFileStream(testFileId, testAccessToken)

      expect(mockDrive.files.get).toHaveBeenCalledWith(
        { fileId: testFileId, alt: "media" },
        { responseType: "stream" }
      )

      expect(result).toBe(mockStream)
    })
    it("should throw error when getting file stream fails", async () => {
      const testError = new Error("Getting file stream failed")
      mockDrive.files.get.mockRejectedValueOnce(testError)

      await expect(
        getDriveFileStream(testFileId, testAccessToken)
      ).rejects.toThrow(testError)
    })
  })
})
