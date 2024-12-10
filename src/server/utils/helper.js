const { getObjectSignedUrl } = require("./s3")
const { getFileSize, getFileType } = require("../utils/s3")

const generateSignedUrlForCue = async (cue, presentationId) => {
  if (typeof cue.file.url === "string") {
    const key = `${presentationId}/${cue.file.id.toString()}`
    cue.file.url = await getObjectSignedUrl(key)
  } else {
    if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
      cue.file.url = "/src/server/public/blank.png"
    } else if (process.env.NODE_ENV === "production") {
      cue.file.url = "/blank.png"
    }
  }
  return cue.file.url
}

const processCueFiles = async (cues, presentationId) => {
  const processedCues = await Promise.all(
    cues.map(async (cue) => {
      await generateSignedUrlForCue(cue, presentationId)
      if (cue.file.url !== "/src/server/public/blank.png" && cue.file.url !== "/blank.png") {
        await getFileType(cue, presentationId)
        await getFileSize(cue, presentationId)
      }
      return cue
    })
  )
  return processedCues
}

module.exports = {
  generateSignedUrlForCue,
  processCueFiles,
}