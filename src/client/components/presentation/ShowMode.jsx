import React, { useState, useEffect, useCallback } from "react"
import Screen from "./Screen"
import ShowModeButtons from "./ShowModeButtons"

// ShowMode component
const ShowMode = ({ cues }) => {
  // Preload cues once on initialization
  const [preloadedCues, setPreloadedCues] = useState({})

  const [cueIndex, setCueIndex] = useState(0)

  const [screenVisibility, setScreenVisibility] = useState(() => {
    const initialScreenVisibility = [...new Set(cues.map((cue) => cue.screen))]

    return initialScreenVisibility.reduce((acc, screenNumber) => {
      acc[screenNumber] = false
      return acc
    }, {})
  })

  const [mirroring, setMirroring] = useState({})

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
      const cuesByScreen = cues.reduce((acc, cue) => {
        if (!acc[cue.screen]) {
          acc[cue.screen] = {}
        }
        acc[cue.screen][cue.index] = cue
        return acc
      }, {})

      const preloadPromises = Object.entries(cuesByScreen).flatMap(
        ([screen, cues]) => {
          preloaded[screen] = {}

          return Object.entries(cues).map(async ([cueId, cue]) => {
            if (cue.file?.url) {
              await preloadImage(cue.file.url)
            }
            preloaded[screen][cueId] = cue
          })
        }
      )

      // Wait for all preloads to finish
      await Promise.all(preloadPromises)

      setPreloadedCues(preloaded)
    }

    preloadCueData()
  }, [cues])

  // Toggle screen visibility
  const toggleScreenVisibility = (screenNumber) => {
    setScreenVisibility((prevVisibility) => ({
      ...prevVisibility,
      [screenNumber]: !prevVisibility[screenNumber],
    }))
  }

  const toggleScreenMirroring = (screenNumber, targetScreen) => {
    setMirroring((prevMirroring) => {
      const updatedMirroring = { ...prevMirroring }
      if (targetScreen) {
        updatedMirroring[screenNumber] = targetScreen
      } else {
        delete updatedMirroring[screenNumber]
      }
      return updatedMirroring
    })
  }

  const handleScreenClose = useCallback((screenNumber) => {
    setScreenVisibility((prevVisibility) => ({
      ...prevVisibility,
      [screenNumber]: false,
    }))
  }, [])

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
        toggleScreenMirroring={toggleScreenMirroring}
        mirroring={mirroring}
        cueIndex={cueIndex}
        updateCue={updateCue}
      />

      {/* Render screens based on visibility and cue index */}
      {Object.keys(preloadedCues).map((screenNumber) => {
        // Check if this screen is mirroring another
        const mirroredScreen = mirroring[screenNumber]
        const sourceScreen = mirroredScreen ? mirroredScreen : screenNumber

        return (
          <Screen
            key={screenNumber}
            screenData={preloadedCues[sourceScreen]?.[cueIndex]}
            screenNumber={screenNumber}
            isVisible={screenVisibility[screenNumber]}
            onClose={handleScreenClose}
          />
        )
      })}
    </div>
  )
}

export default ShowMode
