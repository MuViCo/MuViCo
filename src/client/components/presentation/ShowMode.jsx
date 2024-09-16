import React, { useState } from "react"
import preloadCues from "../utils/preloadCues"
import Screen from "./Screen"
import ShowModeButtons from "./ShowModeButtons"

// ShowMode component
const ShowMode = ({ presentationInfo }) => {
  // Preload cues once on initialization
  const [screenCues] = useState(() => preloadCues(presentationInfo))
  console.log(screenCues)

  // Manage the current cue index and screen visibility
  const [cueIndex, setCueIndex] = useState(0)
  const [screenVisibility, setScreenVisibility] = useState(
    Array(Object.keys(screenCues).length).fill(false)
  )

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
      setCueIndex((prevCueIndex) => Math.max(1, prevCueIndex - 1)) // Prevent going below cue 1
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
      {Object.keys(screenCues).map((screenNumber) => (
        <Screen
          key={screenNumber}
          screenData={screenCues[screenNumber][cueIndex]}
          screenNumber={screenNumber}
          isVisible={screenVisibility[screenNumber - 1]} // Visibility state is indexed from 0
        />
      ))}
    </div>
  )
}

export default ShowMode
