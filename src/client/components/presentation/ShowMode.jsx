import React, { useState, useEffect } from "react"
import Screen from "./Screen"
import ShowModeButtons from "./ShowModeButtons"
import preloadCues from "../utils/preloadCues"

// ShowMode component
const ShowMode = ({ presentationInfo }) => {
  // Preload cues once on initialization
  const [preloadedCues, setPreloadedCues] = useState({})

  const [screenCues] = useState(() => preloadCues(presentationInfo));

  // Manage the current cue index and screen visibility
  const [cueIndex, setCueIndex] = useState(0)
  
  const [screenVisibility, setScreenVisibility] = useState(() =>Array(Object.keys(screenCues).length).fill(false))


  useEffect(() => {
    const preloadImage = (url) => {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.src = url
        img.onload = () => resolve(true)
        img.onerror = reject
      })
    }

    const preloadCueData = async () => {
      const preloaded = {}
      for (let screen in screenCues) {
        preloaded[screen] = {}
        for (let cueId in screenCues[screen]) {
          const cue = screenCues[screen][cueId]
          if (cue.file?.url) {
            try {
              await preloadImage(cue.file.url)
            } catch (error) {
              console.error(`Error preloading image for cue: ${cue.name}`, error)
            }
          }
          preloaded[screen][cueId] = cue
        }
      }
      setPreloadedCues(preloaded)
    }

    preloadCueData()
  }, [screenCues])

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
        />
      ))}
    </div>
  )
}

export default ShowMode
