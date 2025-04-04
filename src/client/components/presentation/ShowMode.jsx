import React, { useState, useEffect, useCallback } from "react"
import Screen from "./Screen"
import ShowModeButtons from "./ShowModeButtons"
import KeyboardHandler from "../utils/keyboardHandler"

// ShowMode component
const ShowMode = ({ cues, cueIndex, setCueIndex }) => {
  // Preload cues once on initialization
  const [preloadedCues, setPreloadedCues] = useState({})

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
    const preloadVideo = (url) => {
      return new Promise((resolve) => {
        const video = document.createElement("video")
        video.src = url
        video.preload = "auto"
        video.oncanplaythrough = () => resolve(true)
        video.onerror = () => {
          console.error(`Error loading video: ${url}`)
          resolve(false)
        }
        // Force load in some browsers
        video.load()
      })
    }
    const preloadAudio = (url) => {
      return new Promise((resolve) => {
        const audio = new Audio()
        audio.src = url
        audio.preload = "auto"
        audio.oncanplaythrough = () => resolve(true)
        audio.onerror = () => {
          console.error(`Error loading audio: ${url}`)
          resolve(false)
        }
        // Force load in some browsers
        audio.load()
      })
    }

    const preloadFile = (url, fileType) => {
      if (!url) return Promise.resolve(false)

      if (fileType?.startsWith("image/")) {
        return preloadImage(url)
      } else if (fileType?.startsWith("audio/")) {
        return preloadAudio(url)
      } else if (fileType?.startsWith("video/")) {
        return preloadVideo(url)
      }
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
              await preloadFile(cue.file.url, cue.file.type)
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

  // Get the last available cue if the current cueIndex is missing
  const getLastValidCue = (screen, index) => {
    while (index >= 0) {
      if (preloadedCues[screen]?.[index]) {
        return preloadedCues[screen][index]
      }
      index -= 1
    }
    return {}
  }

  return (
    <div className="show-mode">
      {/* Pass screen visibility and cue navigation to ShowModeButtons */}
      <KeyboardHandler
        onNext={() => updateCue("Next")}
        onPrevious={() => updateCue("Previous")}
      />

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

        const screenData = getLastValidCue(sourceScreen, cueIndex)

        return (
          <Screen
            key={screenNumber}
            screenData={screenData}
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
