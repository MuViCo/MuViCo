/** KeyboardHandler.jsx
 * A reusable component for handling keyboard events for navigation.
 */

import { useEffect } from "react"

interface KeyboardHandlerProps {
  onNext: () => void
  onPrevious: () => void
  onTogglePlay?: () => void
}

/**
 * True for anything that legitimately consumes the key itself: a space typed
 * into a field is text, and a space on a button or a link is that control's own
 * activation, which would toggle playback twice if it also reached here.
 */
const consumesKeys = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  return Boolean(
    target.closest("input, textarea, select, button, a, [role='menuitem']")
  )
}

const KeyboardHandler = ({
  onNext,
  onPrevious,
  onTogglePlay,
}: KeyboardHandlerProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case " ":
          // Space was never bound: playback answered it only because the play
          // button still had focus, and the browser scrolled the editor as its
          // default action for the key. Now that the editor is a scroller, that
          // meant every play or pause jumped to the bottom of the timeline.
          if (!onTogglePlay || consumesKeys(e.target)) break
          e.preventDefault()
          onTogglePlay()
          break
        case "ArrowRight":
        case "PageDown":
        case "ArrowUp":
          e.preventDefault()
          onNext()
          break
        case "ArrowLeft":
        case "PageUp":
        case "ArrowDown":
          e.preventDefault()
          onPrevious()
          break
        default:
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onNext, onPrevious, onTogglePlay])

  return null
}

export default KeyboardHandler
