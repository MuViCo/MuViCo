import { useCallback, useState } from "react"
import type { SyntheticEvent } from "react"

type MediaElement = HTMLImageElement | HTMLVideoElement

const isVideo = (element: MediaElement): element is HTMLVideoElement =>
  "videoWidth" in element

const sizeOf = (element: MediaElement): [number, number] =>
  isVideo(element)
    ? [element.videoWidth, element.videoHeight]
    : [element.naturalWidth, element.naturalHeight]

/** Whether the element already knows its own size. */
const isResolved = (element: MediaElement): boolean =>
  isVideo(element) ? element.readyState >= 1 : element.complete

/**
 * A media file's own width/height, once the browser knows it.
 *
 * The load event alone isn't enough: media the browser already has cached
 * resolves before React attaches the handler, so the event never fires and
 * the caller waits forever. The editor hits this constantly -- it has shown
 * the same file in the media pool already -- which left spanning cues
 * rendering as if they didn't span. The ref covers that by reading the size
 * at mount instead.
 */
export const useMediaAspectRatio = () => {
  const [aspectRatio, setAspectRatio] = useState<number | null>(null)

  const read = useCallback((element: MediaElement | null) => {
    if (!element) return
    const [width, height] = sizeOf(element)
    if (width > 0 && height > 0) setAspectRatio(width / height)
  }, [])

  const probeRef = useCallback(
    (element: MediaElement | null) => {
      if (element && isResolved(element)) read(element)
    },
    [read]
  )

  const onLoad = useCallback(
    (event: SyntheticEvent<MediaElement>) => read(event.currentTarget),
    [read]
  )

  return { aspectRatio, probeRef, onLoad }
}
