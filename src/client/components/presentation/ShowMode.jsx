import React, { useState, useEffect } from "react"
import Screen from "./Screen"
import ShowModeButtons from "./ShowModeButtons"

// ShowMode component
const ShowMode = ({ presentationInfo }) => {
  // Preload cues once on initialization
  const [preloadedCues, setPreloadedCues] = useState({})

  const [cueIndex, setCueIndex] = useState(0)
  
  const [screenVisibility, setScreenVisibility] = useState(() => {
    const initialScreenVisibility = [...new Set(presentationInfo.cues.map(cue => cue.screen))]
  
    return initialScreenVisibility.reduce((acc, screenNumber) => {
      acc[screenNumber] = false
      return acc
    }, {})
  })

  useEffect(() => {
    const preloadImage = (url) => {
      return new Promise((resolve) => {
        const img = new Image()
        img.src = url
        img.onload = () => resolve(true)
        img.onerror = () => {
          console.error(`Error loading image: ${url}`)
          resolve(false)
        }
      })
    }
  
    const preloadCueData = async () => {
      const preloaded = {}
  
      // Group cues by screen number
      const cuesByScreen = presentationInfo.cues.reduce((acc, cue) => {
        if (!acc[cue.screen]) {
          acc[cue.screen] = {}
        }
        acc[cue.screen][cue.index] = cue
        return acc
      }, {})
  
      const preloadPromises = Object.entries(cuesByScreen).flatMap(([screen, cues]) => {
        preloaded[screen] = {}
  
        return Object.entries(cues).map(async ([cueId, cue]) => {
          if (cue.file?.url) {
            await preloadImage(cue.file.url)
          }
          preloaded[screen][cueId] = cue
        })
      })
  
      // Wait for all preloads to finish
      await Promise.all(preloadPromises)
  
      setPreloadedCues(preloaded)
    }
  
    preloadCueData()
  }, [presentationInfo])
  

  // Toggle screen visibility
  const toggleScreenVisibility = (screenNumber) => {
  setScreenVisibility(prevVisibility => ({
    ...prevVisibility,
    [screenNumber]: !prevVisibility[screenNumber]
  }))
}


  const updateCue = (direction) => {
    if (direction === "Next") {
      setCueIndex((prevCueIndex) => prevCueIndex + 1)
    } else {
      setCueIndex((prevCueIndex) => Math.max(0, prevCueIndex - 1))
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
          screenData={preloadedCues[screenNumber][cueIndex]}
          screenNumber={screenNumber}
          isVisible={screenVisibility[screenNumber]}
        />
      ))}
    </div>
  )
}

export default ShowMode
