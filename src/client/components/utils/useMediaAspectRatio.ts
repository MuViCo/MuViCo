import { useCallback, useState } from "react"
import type { SyntheticEvent } from "react"

/**
 * An image's own width/height, once the browser knows it.
 *
 * `onLoad` alone isn't enough: an image the browser already has cached is
 * complete before React attaches the handler, so the event never fires and
 * the caller waits forever. The editor hits this constantly -- it has shown
 * the same file elsewhere already -- which left spanning cues rendering as
 * if they didn't span. The ref covers that case by reading the size at
 * mount.
 */
export const useMediaAspectRatio = () => {
  const [aspectRatio, setAspectRatio] = useState<number | null>(null)

  const read = useCallback((image: HTMLImageElement | null) => {
    if (!image) return
    const { naturalWidth, naturalHeight } = image
    if (naturalWidth > 0 && naturalHeight > 0) {
      setAspectRatio(naturalWidth / naturalHeight)
    }
  }, [])

  const probeRef = useCallback(
    (image: HTMLImageElement | null) => {
      if (image?.complete) read(image)
    },
    [read]
  )

  const onLoad = useCallback(
    (event: SyntheticEvent<HTMLImageElement>) => read(event.currentTarget),
    [read]
  )

  return { aspectRatio, probeRef, onLoad }
}
