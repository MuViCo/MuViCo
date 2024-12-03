const { getObjectSignedUrl } = require("./s3")

const generateSignedUrlForCue = async (cue, presentationId) => {
  if (typeof cue.file.url === "string") {
    const key = `${presentationId}/${cue.file.id.toString()}`
    cue.file.url = await getObjectSignedUrl(key)
  } else {
    if (process.env.NODE_ENV === "development") {
      cue.file.url = "/src/server/public/blank.png"
    } else {
      cue.file.url = "/blank.png"
    }
  }
  return cue
}

module.exports = {
  generateSignedUrlForCue,
}