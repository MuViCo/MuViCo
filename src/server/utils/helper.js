const { getObjectSignedUrl } = require("./s3")
const { getFileSize, getFileType } = require("../utils/s3")

const generateSignedUrlForCue = async (cue, presentationId) => {
  if (typeof cue.file.url === "string") {
    const key = `${presentationId}/${cue.file.id.toString()}`
    cue.file.url = await getObjectSignedUrl(key)
  } else {
    if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
      cue.file.url = "/src/server/public/blank.png"
    } else {
      cue.file.url = "/blank.png"
    }
  }
  return cue
}

const processCueFiles = async (cues, presentationId) => {
  const processedCues = await Promise.all(
    cues.map(async (cue) => {
      await generateSignedUrlForCue(cue, presentationId)
      if (cue.file.url === "/src/server/public/blank.png" || cue.file.url === "/blank.png") {
        cue.file.size = 0
        cue.file.type = "image/png"
      } else
      if (cue.file.url !== "/src/server/public/blank.png" || cue.file.url !== "/blank.png") {
        await getFileSize(cue, presentationId)
        await getFileType(cue, presentationId)
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