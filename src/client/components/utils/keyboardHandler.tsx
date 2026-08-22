/** KeyboardHandler.jsx
 * A reusable component for handling keyboard events for navigation.
 */

import { useEffect } from "react"

interface KeyboardHandlerProps {
  onNext: () => void
  onPrevious: () => void
}

const KeyboardHandler = ({ onNext, onPrevious }: KeyboardHandlerProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
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
  }, [onNext, onPrevious])

  return null
}

export default KeyboardHandler
