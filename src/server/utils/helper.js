const { getFileMetadata } = require("./drive");

const generateDriveFileUrlForCue = async (cue, accessToken) => {
  // Assumes that cue.file.driveId is set after upload
  console.log("cue file:", cue.file, "cue file id:" , cue.file.id)
  if (cue.file && cue.file.driveId) {
    // Construct a URL that allows direct viewing
    cue.file.url = `https://lh3.googleusercontent.com/d/${cue.file.driveId}`;
    try {
      const metadata = await getFileMetadata(cue.file.driveId, accessToken);
      cue.file.type = metadata.mimeType;
      cue.file.size = metadata.size;
    } catch (error) {
      console.error("Error fetching file metadata:", error);
    }
  } else {
    // Fallback to a default image if needed
    cue.file.url = process.env.NODE_ENV === "production" ? "/blank.png" : "/src/server/public/blank.png";
  }
  console.log("file url:", cue.file.url)
  return cue;
};

const processCueFiles = async (cues, accessToken) => {
  const processedCues = await Promise.all(
    cues.map(async (cue) => {
      await generateDriveFileUrlForCue(cue, accessToken);
      // Optionally, you can add a call here to get the file size/type from Drive if needed:
      // e.g., await getDriveFileMetadata(cue)
      return cue;
    })
  );
  return processedCues;
};

module.exports = {
  processCueFiles,
}