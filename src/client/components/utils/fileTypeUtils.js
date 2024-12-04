export const getFileType = (url) => {
    const extension = url.split(".").pop().toLowerCase()
    const imageExtensions = ["png", "jpg", "jpeg", "gif"]
    const videoExtensions = ["mp4", "avi", "mov", "mkv"]
  
    if (imageExtensions.includes(extension)) {
      return "image"
    } else if (videoExtensions.includes(extension)) {
      return "video"
    } else {
      return "unknown"
    }
  }
  