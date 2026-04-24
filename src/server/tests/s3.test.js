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
} from "@aws-sdk/client-s3"

const {
  uploadFileS3,
  deleteFileS3,
  getObjectSignedUrl,
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
    expect(url).toContain("https://")
  })
})
