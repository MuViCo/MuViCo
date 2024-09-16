import React, { useState, useEffect } from "react"
import ReactDOM from "react-dom"

// Screen Component (handles window logic and content rendering)
const Screen = ({ screenNumber, cue, isVisible, toggleVisibility }) => {
  const [container, setContainer] = useState(null)

  useEffect(() => {
    if (isVisible) {
      const newWindow = window.open("", ` Screen ${screenNumber}`, "width=800,height=600")
      const div = document.createElement("div")
      newWindow.document.body.appendChild(div)
      setContainer(div)

      // Handle window close
      const handleClose = () => {
        toggleVisibility(screenNumber)
        newWindow.close()
      }

      newWindow.addEventListener("beforeunload", handleClose)
      return () => {
        newWindow.removeEventListener("beforeunload", handleClose)
        newWindow.close()
      }
    }
  }, [isVisible, screenNumber, toggleVisibility])

  // This useEffect listens for changes to the cue and updates the content accordingly
  useEffect(() => {
    if (container && isVisible) {
      // Optionally update the window title or other window attributes based on cue
      document.title = `Screen ${screenNumber} - Cue: ${cue?.name || ""}`
    }
  }, [cue, container, isVisible])

  // Render updated content based on the cue
  const screenContent = (
    <div>
      <h1>Screen {screenNumber}</h1>
      {cue ? (
        <>
          <p><strong>Cue Name:</strong> {cue.name}</p>
          <p><strong>File:</strong> {cue.file?.name}</p>
          {/* Add any additional cue details or media (images, videos, etc.) */}
        </>
      ) : (
        <p>No cue data available</p>
      )}
    </div>
  )

  return container && isVisible ? ReactDOM.createPortal(screenContent, container) : null
}

export default Screen
