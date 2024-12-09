export const isImage = (file) => {
    if (file.type.includes("image")) {
      return true
    } else {
      return false
    }
  }