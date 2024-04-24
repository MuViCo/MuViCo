
const AWSMock = require('aws-sdk-mock')
const AWS = require('aws-sdk')
const { uploadFile, deleteFile, getObjectSignedUrl } = require('../utils/s3')

describe('S3 operations', () => {
  beforeAll(() => {
    AWSMock.setSDKInstance(AWS)
  })

  afterEach(() => {
    AWSMock.restore('S3')
  })

  it('should upload a file', async () => {
    AWSMock.mock('S3', 'putObject', (_, callback) => {
      callback(null, { ETag: "\"e283c504365c76c53a7807ba6c8d86c3\"", ServerSideEncryption: "AES256" })
    })

    const response = await uploadFile('fileBuffer', 'fileName', 'mimetype')
    expect(response).toHaveProperty('ETag')
    expect(response).toHaveProperty('ServerSideEncryption')
  })

  it('should delete a file', async () => {
    AWSMock.mock('S3', 'deleteObject', (_, callback) => {
      callback(null, { $metadata: { attempts: 1, httpStatusCode: 204 } })
    })

    const response = await deleteFile('fileName')
    expect(response).toHaveProperty('$metadata')
    expect(response.$metadata).toHaveProperty('attempts')
    expect(response.$metadata).toHaveProperty('httpStatusCode', 204)
  })

  it('should get signed URL', async () => {
    AWSMock.mock('S3', 'getObject', (_, callback) => {
      callback(null, 'Successfully got object from S3')
    })

    const url = await getObjectSignedUrl('key')
    expect(url).toContain('https://')
  })
})
