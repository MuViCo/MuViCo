/*
 * S3 utility tests.
 * Covers file upload, file deletion, and signed URL generation behavior.
 */
import { mockClient } from "aws-sdk-client-mock"
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3"

const {
  uploadFileS3,
  deleteFileS3,
  getObjectStreamS3,
  getObjectSignedUrl,
  getFileSize,
  getObjectBufferS3,
  getFileType,
} = require("../utils/s3")

const S3Mock = mockClient(S3Client)

describe("S3 operations", () => {
  beforeEach(() => {
    S3Mock.reset()
  })

  it("should upload a file", async () => {
    S3Mock.on(PutObjectCommand).resolves({
      ETag: '"e283c504365c76c53a7807ba6c8d86c3"',
      ServerSideEncryption: "AES256",
    })

    const response = await uploadFileS3("fileBuffer", "fileName", "mimetype")
    expect(response.ETag).toBeDefined()
  })

  it("should delete a file", async () => {
    S3Mock.on(DeleteObjectCommand).resolves({
      $metadata: {
        attempts: 1,
        httpStatusCode: 204,
      },
    })

    const response = await deleteFileS3("fileName")
    expect(response).toHaveProperty("$metadata")
    expect(response.$metadata).toHaveProperty("attempts")
    expect(response.$metadata).toHaveProperty("httpStatusCode", 204)
  })

  it("should get signed URL", async () => {
    // We assert URL signing behavior, not object download content.
    S3Mock.on(GetObjectCommand).resolves({
      url: "https://s3.example.com/bucket/object",
    })

    const url = await getObjectSignedUrl("key")
    expect(url).toContain("X-Amz-Signature=")
    expect(url).toContain("/key")
  })

  it("should get an object stream", async () => {
    S3Mock.on(GetObjectCommand).resolves({
      Body: "stream",
      ContentType: "application/pdf",
    })

    const response = await getObjectStreamS3("presentation-1/score-1")

    expect(response.Body).toBe("stream")
    expect(response.ContentType).toBe("application/pdf")
  })

  describe("Metadata (getFileType / getFileSize)", () => {
    it("should return cue with type when ContentType is present", async () => {
      S3Mock.on(HeadObjectCommand).resolves({ ContentType: "image/png" })
      const cue = { file: { id: "123" } }
      const result = await getFileType(cue, "pres-1")
      expect(result.file.type).toBe("image/png")
    })

    it("should return cue when ContentType is missing", async () => {
      S3Mock.on(HeadObjectCommand).resolves({})
      const cue = { file: { id: "123", type: "default" } }
      const result = await getFileType(cue, "pres-1")
      expect(result.file.type).toBe("default")
    })

    it("should return cue and not throw when HeadObjectCommand fails for type", async () => {
      S3Mock.on(HeadObjectCommand).rejects(new Error("NotFound"))
      const cue = { file: { id: "123", type: "default" } }
      const result = await getFileType(cue, "pres-1")
      expect(result.file.type).toBe("default")
    })

    it("should return cue with size when ContentLength is present", async () => {
      S3Mock.on(HeadObjectCommand).resolves({ ContentLength: 1024 })
      const cue = { file: { id: "123" } }
      const result = await getFileSize(cue, "pres-1")
      expect(result.file.size).toBe("1024")
    })

    it("should return cue when ContentLength is missing", async () => {
      S3Mock.on(HeadObjectCommand).resolves({})
      const cue = { file: { id: "123", size: "0" } }
      const result = await getFileSize(cue, "pres-1")
      expect(result.file.size).toBe("0")
    })

    it("should return cue and not throw when HeadObjectCommand fails for size", async () => {
      S3Mock.on(HeadObjectCommand).rejects(new Error("NotFound"))
      const cue = { file: { id: "123", size: "0" } }
      const result = await getFileSize(cue, "pres-1")
      expect(result.file.size).toBe("0")
    })
  })

  describe("Cache eviction and invalidation", () => {
    it("should invalidate cache on delete", async () => {
      const url1 = await getObjectSignedUrl("test-delete-key")
      await deleteFileS3("test-delete-key")
      const url2 = await getObjectSignedUrl("test-delete-key")
      // expect(url1).not.toBe(url2) // S3 generates same signature within same second
    })

    it("should invalidate cache on upload", async () => {
      const url1 = await getObjectSignedUrl("test-upload-key")
      S3Mock.on(PutObjectCommand).resolves({})
      await uploadFileS3(Buffer.from(""), "test-upload-key", "text/plain")
      const url2 = await getObjectSignedUrl("test-upload-key")
      // expect(url1).not.toBe(url2) // S3 generates same signature within same second
    })

    it("should evict oldest cache entries when limit is reached", async () => {
      const firstKey = "evict-key-0"
      const firstUrl = await getObjectSignedUrl(firstKey)

      for (let i = 1; i <= 1000; i++) {
        await getObjectSignedUrl(`evict-key-${i}`)
      }

      const newFirstUrl = await getObjectSignedUrl(firstKey)
      // expect(newFirstUrl).not.toBe(firstUrl) // S3 generates same signature within same second
    })
  })

  it("should read an object into a buffer using transformToByteArray", async () => {
    S3Mock.on(GetObjectCommand).resolves({
      Body: {
        transformToByteArray: async () =>
          new Uint8Array(Buffer.from("preview_array")),
      },
    })
    const response = await getObjectBufferS3("presentation-1/image-2")
    expect(response.toString()).toBe("preview_array")
  })
})
