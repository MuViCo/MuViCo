import React, { useState, useEffect } from "react"
import ReactDOM from "react-dom"

const Screen = ({ screenNumber, screenData, isVisible }) => {
  const [container, setContainer] = useState(null)

  useEffect(() => {
    if (isVisible) {
      const newWindow = window.open(screenData.file.url, ` Screen ${screenNumber}`, "width=800,height=600")
      const div = document.createElement("div")
      newWindow.document.body.appendChild(div)
      setContainer(div)

      // Handle window close
      const handleClose = () => {
        newWindow.close()
      }

      newWindow.addEventListener("beforeunload", handleClose)
      return () => {
        newWindow.removeEventListener("beforeunload", handleClose)
        newWindow.close()
      }
    }
  }, [isVisible, screenNumber])

  // This useEffect listens for changes to the screenData and updates the content accordingly
  useEffect(() => {
    if (container && isVisible) {
      // Optionally update the window title or other window attributes based on screenData
      document.title = `Screen ${screenNumber} - Cue: ${screenData?.name || ""}`
    }
  }, [screenData, container, isVisible])

  // Render updated content based on the screenData
  const screenContent = (
    <div>
      <h1>Screen {screenNumber}</h1>
      {screenData ? (
        <>
          <p><strong>Cue Name:</strong> {screenData.name}</p>
          <p><strong>File:</strong> {screenData.file?.name}</p>
          {/* Add any additional screenData details or media (images, videos, etc.) */}
        </>
      ) : (
        <p>No cue data available</p>
      )}
    </div>
  )

  return container && isVisible ? ReactDOM.createPortal(screenContent, container) : null
}

export default Screen