export const isType = {
  image: (file) => file?.type?.includes("image"),
  video: (file) => file?.type?.includes("video"),
  audio: (file) => file?.type?.includes("audio"),
}
