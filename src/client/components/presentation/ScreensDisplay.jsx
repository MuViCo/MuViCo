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
import { normalizeCueOpacity } from "../utils/cueOpacityUtils"

const sortByLayerPriority = (cues) =>
  [...cues].sort((firstCue, secondCue) => Number(secondCue.layer ?? 0) - Number(firstCue.layer ?? 0))

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

  const getCurrentCueStackForScreen = (screenNumber) => {
    const cuesOnScreen = screenSortedCuesByScreen[Number(screenNumber)] || []
    if (cuesOnScreen.length === 0) return []

    const currentIndex = Number(cueIndex)

    const cueStack = cuesOnScreen
      .filter((cue) => {
        const cueStartIndex = Number(cue.index)
        const cueSpan = getCueVisualSpanFromMap(cue, cueVisualSpanMap)
        const cueEndIndex = cueStartIndex + cueSpan - 1
        return currentIndex >= cueStartIndex && currentIndex <= cueEndIndex
      })

    return sortByLayerPriority(cueStack)
  }

  const renderCuePreview = (cue) => {
    if (cue?.file?.url) {
      if (isImageFile(cue.file)) {
        return (
          <img
            src={cue.file.url}
            alt={cue.name}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        )
      }

      if (isVideoFile(cue.file)) {
        return (
          <video
            src={cue.file.url}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
            autoPlay
            loop
            muted
            playsInline
          />
        )
      }

      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
          Unsupported content type
        </div>
      )
    }

    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          backgroundColor: cue.color || "#333",
        }}
      />
    )
  }

  return (
    <div style={{ display: "flex", justifyContent: "space-evenly", alignItems: "stretch", flexWrap: "wrap", backgroundColor: editModeBackground, gap: "10px", padding: "10px", paddingBottom: "15px", width: "100%", height: "100%", overflow: "hidden" }}>
      {Array.from({ length: screenCount }).map((_, index) => {
        const screenNumber = index + 1
        const screenStack = getCurrentCueStackForScreen(screenNumber)

        return (
          <div key={screenNumber} style={{ flex: 1, display: "flex", flexDirection: "column", backgroundColor: "black", color: "white", overflow: "hidden", position: "relative", aspectRatio: "16/9" }}>
            <div style={{ position: "absolute", top: "10px", left: "10px", zIndex: 200 }}>Screen {screenNumber}</div>
            <Button
              size="xs"
              colorScheme={screens[screenNumber] ? "red" : "purple"}
              onClick={() => toggleScreenVisibility(screenNumber)}
              style={{ position: "absolute", top: "10px", right: "10px", zIndex: 200 }}
            >
              {screens[screenNumber] ? "Close" : "Open"}
            </Button>
            {screenStack.length > 0 ? (
              screenStack.map((cue) => (
                <div
                  key={cue._id}
                  style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 5 + (100 - Number(cue.layer ?? 0)),
                    opacity: normalizeCueOpacity(cue.opacity),
                  }}
                >
                  {renderCuePreview(cue)}
                </div>
              ))
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
