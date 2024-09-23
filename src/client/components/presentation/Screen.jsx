import React, { useEffect, useRef } from "react"

const Screen = ({ screenNumber, screenData, isVisible}) => {
  const windowRef = useRef(null)

  useEffect(() => {
    if (isVisible && !windowRef.current) {
      const newWindow = window.open("", `Screen ${screenNumber}`, "width=800,height=600")
      windowRef.current = newWindow

      if (!screenData) {

        newWindow.document.body.innerHTML = `
        <div>
        <h1>Screen ${screenNumber}</h1>
        <div id="screen-content"></div>
        </div>
        `
      } else {
        newWindow.document.body.innerHTML = `
        <div>
        <h1>Screen ${screenNumber}</h1>
        <div id="screen-content">
        <p><strong>Cue Name:</strong> ${screenData.name}</p>
        <img src="${screenData.file.url}" style="max-width: 100%;" alt="${screenData.name}" />
        </div>
        </div>
        `
      }

    // Add listener to handle window close
    newWindow.addEventListener("beforeunload", () => {
      windowRef.current = null
    })
  }

  if (!isVisible && windowRef.current) {
    windowRef.current.close() // Close the window
    windowRef.current = null // Reset the window reference
  }

  return () => {
    // Ensure the window is closed when the component unmounts
    if (windowRef.current) {
      windowRef.current.close()
      windowRef.current = null
    }
  }
}, [isVisible, screenNumber])


  // Update window content when `screenData` changes
  useEffect(() => {
    if (windowRef.current && screenData) {
      const contentDiv = windowRef.current.document.getElementById("screen-content")

      if (screenData?.file?.url) {
        contentDiv.innerHTML = `
          <p><strong>Cue Name:</strong> ${screenData.name}</p>
          <img src="${screenData.file.url}" style="max-width: 100%;" alt="${screenData.name}" />
        `
      } else {
        contentDiv.innerHTML = `
          <p>No media available for this cue.</p>
        `
      }
    }
  }, [screenData])

  return null
}

export default Screen
