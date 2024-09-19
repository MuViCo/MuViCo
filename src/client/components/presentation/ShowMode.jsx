import React, { useState, useEffect } from "react"
import Screen from "./Screen"
import ShowModeButtons from "./ShowModeButtons"

// ShowMode component
const ShowMode = ({ presentationInfo }) => {
  // Preload cues once on initialization
  const [preloadedCues, setPreloadedCues] = useState({})

  // Manage the current cue index and screen visibility
  const [cueIndex, setCueIndex] = useState(0)
  const [screenVisibility, setScreenVisibility] = useState({})

  useEffect(() => {
    const preloadImage = (url) => {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.src = url
        img.onload = () => resolve(true)
        img.onerror = () => {
          console.error(`Error loading image: ${url}`)
          resolve(false) // Resolve with false to continue, even on error
        }
      })
    }

    const organizeAndPreloadCues = async () => {
      const screenCues = {}

      for (let cue of presentationInfo.cues) {
        const { screen: screenNumber, index: cueIndex, file, name, _id: cueId } = cue

        // Ensure screenCues has an entry for the current screen
        if (!screenCues[screenNumber]) {
          screenCues[screenNumber] = {}
        }

        // Preload the media file if available
        if (file?.url) {
          try {
            await preloadImage(file.url) // Preload the image
          } catch (error) {
            console.error(`Error preloading file for cue: ${name}`, error)
          }
        }

        // Store the cue with fallback values
        screenCues[screenNumber][cueIndex] = {
          name: name || "Unknown Cue",
          file: file || { url: null }, // Fallback to an empty file object if missing
          cueId: cueId || "unknown-id",
        }
      }

      // Store the preloaded cues in state
      setPreloadedCues(screenCues)

      // Initialize screen visibility state
      setScreenVisibility(
        Array(Object.keys(screenCues).length).fill(false)
      )
    }

    organizeAndPreloadCues()
  }, [presentationInfo])

  
  // Toggle screen visibility
  const toggleScreenVisibility = (screenNumber) => {
    const screenIdx = screenNumber - 1
    setScreenVisibility((prev) => prev.map((isVisible, index) => (index === screenIdx ? !isVisible : isVisible)))
  }

  // Update cue (Next or Previous)
  const updateCue = (direction) => {
    if (direction === "Next") {
      setCueIndex((prevCueIndex) => prevCueIndex + 1)
    } else {
      setCueIndex((prevCueIndex) => Math.max(0, prevCueIndex - 1)) // Prevent going below cue 1
    }
  }

  return (
    <div className="show-mode">
      {/* Pass screen visibility and cue navigation to ShowModeButtons */}
      <ShowModeButtons
        screens={screenVisibility}
        toggleScreenVisibility={toggleScreenVisibility}
        cueIndex={cueIndex}
        updateCue={updateCue}
      />

      {/* Render screens based on visibility and cue index */}
      {Object.keys(preloadedCues).map((screenNumber) => (
        <Screen
          key={screenNumber}
          screenData={preloadedCues[screenNumber][cueIndex]} // Use preloaded cues
          screenNumber={screenNumber}
          isVisible={screenVisibility[screenNumber - 1]}
          onWindowClose={toggleScreenVisibility} // Pass the function to handle window close

        />
      ))}
    </div>
  )
}

export default ShowMode
