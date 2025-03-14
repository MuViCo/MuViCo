import { useEffect } from "react"

const KeyboardHandler = ({ onNext, onPrevious }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case "ArrowRight":
        case "PageDown":
          e.preventDefault()
          onNext()
          break
        case "ArrowLeft":
        case "PageUp":
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
