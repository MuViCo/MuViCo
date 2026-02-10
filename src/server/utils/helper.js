const { getDriveFileMetadata } = require("./drive")
const { getObjectSignedUrl } = require("./s3")
const { getFileSize, getFileType } = require("../utils/s3")

const generateDriveFileUrlForCue = async (cue, accessToken) => {
  if (cue.file && cue.file.driveId) {
    try {
      const metadata = await getDriveFileMetadata(cue.file.driveId, accessToken)
      cue.file.type = metadata.mimeType
      cue.file.size = metadata.size
      const baseUrl =
        process.env.NODE_ENV === "production"
          ? "https://muvico.live"
          : "http://localhost:3000"

      cue.file.url = `${baseUrl}/api/media/${cue.file.driveId}?access_token=${accessToken}`
    } catch (error) {
      console.error("Error fetching file metadata:", error)
    }
  } else {
    cue.file.url =
      process.env.NODE_ENV === "production"
        ? "/blank.png"
        : "/src/server/public/blank.png"
  }
  return cue
}

const processDriveCueFiles = async (cues, accessToken) => {
  const processedCues = await Promise.all(
    cues.map(async (cue) => {
      await generateDriveFileUrlForCue(cue, accessToken)
      return cue
    })
  )

  return processedCues
}

const generateSignedUrlForS3 = async (cue, presentationId) => {
  if (typeof cue.file.url === "string") {
    const key = `${presentationId}/${cue.file.id.toString()}`
    cue.file.url = await getObjectSignedUrl(key)
  } else {
    // Handle blank images by using the correct filename
    const filename = cue.file.name || "blank.png"
    
    if (
      process.env.NODE_ENV === "development" ||
      process.env.NODE_ENV === "test"
    ) {
      cue.file.url = `/src/server/public/${filename}`
    } else if (process.env.NODE_ENV === "production") {
      cue.file.url = `/${filename}`
    }
  }
  return cue
}

const processS3Files = async (cues, presentationId) => {
  const processedCues = await Promise.all(
    cues.map(async (cue) => {
    //orm returns a proxy that breaks boolean comparisons, so use raw object for checks
      const cueo = cue.toObject();
      if(!cueo.file){
        return cue
      }




      await generateSignedUrlForS3(cue, presentationId)
      if (
        cue.file.url !== "/src/server/public/blank.png" &&
        cue.file.url !== "/blank.png" &&
        cue.file.url !== "/src/server/public/blank-white.png" &&
        cue.file.url !== "/blank-white.png" &&
        cue.file.url !== "/src/server/public/blank-indigo.png" &&
        cue.file.url !== "/blank-indigo.png" &&
        cue.file.url !== "/src/server/public/blank-tropicalindigo.png" &&
        cue.file.url !== "/blank-tropicalindigo.png"
      ) {
        await getFileType(cue, presentationId)
        await getFileSize(cue, presentationId)
      }
      return cue
    })
  )
  return processedCues
}

module.exports = {
  processDriveCueFiles,
  generateSignedUrlForS3,
  processS3Files,
}
