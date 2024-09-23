// This function preloads and organizes cues by screen and cue index in advance
const preloadCues = (presentationInfo) => {
  const screenCues = {}

  presentationInfo.cues.forEach((cue) => {
    const screenNumber = cue.screen
    const cueIndex = cue.index

    // Ensure we have an entry for this screen
    if (!screenCues[screenNumber]) {
      screenCues[screenNumber] = {}
    }

    // Store the cue data under the corresponding cue index for this screen
    screenCues[screenNumber][cueIndex] = {
      name: cue.name,
      file: cue.file,
      cueId: cue._id
    }
  })

  return screenCues
}

export default preloadCues
