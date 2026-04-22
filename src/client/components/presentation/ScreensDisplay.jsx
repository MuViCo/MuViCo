/**
 * screens display component for presentation mode, showing the content of each screen based on the cues and their timing
 * - Displays the content for each screen based on the cues and their timing
 * - Supports images, videos, and colored backgrounds as screen content
 * - Shows "No content" message if there are no cues for a screen at the current cue index
 * - Includes buttons to open/close each screen in edit mode
 * - Uses useMemo to optimize performance by memoizing the cue visual span map and cues sorted by screen
 * - Determines the current cue for each screen based on the cue index and the visual span of each cue
 */

import { Button } from "@chakra-ui/react"
import React, { useMemo } from "react"
import { buildCueVisualSpanMap, getCueVisualSpanFromMap } from "../utils/cueVisualSpanUtils"
import { isType } from "../utils/fileTypeUtils"

// Screens display component
export const ScreensDisplay = ({
  screenCount = 3, cues = [], cueIndex = 0, indexCount = 0, editModeBackground, screens = {}, toggleScreenVisibility = () => { },
}) => {
  const cueVisualSpanMap = useMemo(
    () => buildCueVisualSpanMap(cues, indexCount),
    [cues, indexCount]
  )
  const screenSortedCuesByScreen = useMemo(() => {
    return (cues || []).reduce((acc, cue) => {
      const screenNumber = Number(cue.screen)
      if (!acc[screenNumber]) {
        acc[screenNumber] = []
      }
      acc[screenNumber].push(cue)
      return acc
    }, {})
  }, [cues])

  const getCleanUrl = (file = {}) => {
    const url = file?.url || ""
    return String(url).split("?")[0].split("#")[0]
  }

  const isImageFile = (file = {}) => {
    if (isType.image(file)) return true
    return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(getCleanUrl(file)) // check common image file extensions
  }

  const isVideoFile = (file = {}) => {
    if (isType.video(file)) return true
    return /\.(mp4|webm|ogg|mov|m4v)$/i.test(getCleanUrl(file)) // check common video file extensions
  }

  // Get the current cue for the screen
  const getCurrentCueForScreen = (screenNumber) => {
    const cuesOnScreen = screenSortedCuesByScreen[Number(screenNumber)] || []
    if (cuesOnScreen.length === 0) return null

    const currentIndex = Number(cueIndex)

    // Find the cue that should be displayed on the screen based on the current cue index and the visual span of each cue
    const cueForScreen = [...cuesOnScreen]
      .sort((firstCue, secondCue) => Number(secondCue.index) - Number(firstCue.index))
      .find((cue) => {
        const cueStartIndex = Number(cue.index)
        const cueSpan = getCueVisualSpanFromMap(cue, cueVisualSpanMap)
        const cueEndIndex = cueStartIndex + cueSpan - 1
        return currentIndex >= cueStartIndex && currentIndex <= cueEndIndex
      })

    return cueForScreen || null
  }

  return (
    <div style={{ display: "flex", justifyContent: "space-evenly", alignItems: "stretch", flexWrap: "wrap", backgroundColor: editModeBackground, gap: "10px", padding: "10px", paddingBottom: "15px", width: "100%", height: "100%", overflow: "hidden" }}>
      {Array.from({ length: screenCount }).map((_, index) => {
        const screenNumber = index + 1
        const screenData = getCurrentCueForScreen(screenNumber)

        return (
          <div key={screenNumber} style={{ flex: 1, display: "flex", flexDirection: "column", backgroundColor: "black", color: "white", overflow: "hidden", position: "relative" }}>
            <div style={{ position: "absolute", top: "10px", left: "10px", zIndex: 10 }}>Screen {screenNumber}</div>
            <Button
              size="xs"
              colorScheme={screens[screenNumber] ? "red" : "purple"}
              onClick={() => toggleScreenVisibility(screenNumber)}
              style={{ position: "absolute", top: "10px", right: "10px", zIndex: 10 }}
            >
              {screens[screenNumber] ? "Close" : "Open"}
            </Button>
            {screenData ? (
              screenData?.file?.url ? (
                isImageFile(screenData.file) ? (
                  <img
                    src={screenData.file.url}
                    alt={screenData.name}
                    style={{ width: "100%", height: "100%", objectFit: "contain", aspectRatio: "16/9" }} />
                ) : isVideoFile(screenData.file) ? (
                  <video
                    src={screenData.file.url}
                    style={{ width: "100%", height: "100%", objectFit: "contain", aspectRatio: "16/9" }}
                    autoPlay
                    loop
                    muted
                    playsInline />
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
                    Unsupported content type
                  </div>
                )
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flex: 1,
                    width: "100%",
                    height: "100%",
                    backgroundColor: screenData.color || "#333",
                  }}
                >

                </div>
              )
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
                No content
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
