/**
 * Screen.jsx
 * Component responsible for rendering media cues on individual screens during presentation mode.
 *
 * Key Features:
 * - Opens a new browser window for each screen and renders media cues based on the current presentation state.
 * - Supports images, videos, and audio files, with conditional rendering based on file type.
 * - Implements transitions between cues using Emotion for CSS-in-JS styling.
 * - Displays screen number and cue name as an overlay when the Shift key is held down.
 * - Listens for changes in the assigned cue data and updates the displayed media accordingly.
 * - Cleans up resources and event listeners when the screen is closed or unmounted.
 */

import React, { useEffect, useRef, useState } from "react"
import ReactDOM from "react-dom"
import { Box, Image, Text } from "@chakra-ui/react"
import { isType } from "../utils/fileTypeUtils"
import createCache from "@emotion/cache"
import { CacheProvider } from "@emotion/react"
import { getAnims } from "../../utils/transitionUtils"
import { normalizeCueOpacity } from "../utils/cueOpacityUtils"

const mediaFillProps = {
  width: "100%",
  height: "100%",
  objectFit: "contain",
}

const renderMedia = (file, name, color) => {
  console.log("Rendering media with file:", file)

  if (!file) {
    return <Box bg={color} width="100%" height="100%" />
  }

  if (isType.image(file)) {
    const imageSrc = file.url || `/${file.name}`
    return <Image src={imageSrc} alt={name} {...mediaFillProps} />
  }
  // check if media is video
  if (isType.video(file)) {
    return <video src={file.url} style={mediaFillProps} autoPlay loop muted />
  }
  // check if media is audio
  if (isType.audio(file)) {
    return (
      <audio autoPlay loop controls style={{ width: "100%" }}>
        <source src={file.url} type={file.mimeType || "audio/mpeg"} />
        Your browser does not support the audio element.
      </audio>
    )
  }
  // if no media file, render a solid color background
  return <Box bg={color} width="100%" height="100%" />
  // return <Text>Unsupported media type.</Text>
}

const normalizeCueStack = (screenData) => {
  if (Array.isArray(screenData)) {
    return screenData
  }

  return screenData ? [screenData] : []
}

const cueStackKey = (cueStack) =>
  normalizeCueStack(cueStack)
    .map(
      (cue) =>
        `${cue?._id || ""}:${cue?.index ?? ""}:${cue?.screen ?? ""}:${cue?.layer ?? 0}:${cue?.file?.url || ""}:${cue?.name || ""}:${cue?.color || ""}:${normalizeCueOpacity(cue?.opacity)}`
    )
    .join("|")

const renderCueStack = (cueStack) => {
  const normalizedStack = normalizeCueStack(cueStack)

  if (normalizedStack.length === 0) {
    return <Text>No media available for this cue.</Text>
  }

  return normalizedStack.map((cue, index) => (
    <Box
      key={`${cue._id || cue.name || "cue"}-${cue.index ?? "idx"}-${cue.screen ?? "screen"}-${cue.layer ?? index}-${index}`}
      position="absolute"
      inset="0"
      zIndex={100 - Number(cue.layer ?? 0)}
      opacity={normalizeCueOpacity(cue.opacity)}
      display="flex"
      justifyContent="center"
      alignItems="center"
      overflow="hidden"
    >
      {renderMedia(cue.file, cue.name, cue.color)}
    </Box>
  ))
}

const ScreenContent = ({
  screenNumber,
  currentScreenData,
  previousScreenData,
  showText,
  transitionType,
}) => {
  const { enter: enterAnim, exit: exitAnim } = getAnims(transitionType)
  const animStyle = (kf) => (kf ? `${kf} 500ms ease-in-out forwards` : "none")
  const currentCueStack = normalizeCueStack(currentScreenData)
  const currentCueNames = currentCueStack.map((cue) => cue.name).filter(Boolean)

  return (
    <Box
      bg="black"
      color="white"
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      position="relative"
      overflow="hidden"
    >
      {/* Header with Screen Number on the left and Cue Name on the right */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        position="absolute"
        width="90vw"
        left="5vw"
        zIndex={2}
      >
        <Text
          fontSize="xl"
          textShadow="1px 0 2px #000000"
          style={{ visibility: showText ? "visible" : "hidden" }}
        >
          Screen {screenNumber}
        </Text>
        {currentCueNames.length > 0 && (
          <Text
            fontSize="xl"
            textShadow="1px 0 2px #000000"
            style={{ visibility: showText ? "visible" : "hidden" }}
          >
            Element Name: {currentCueNames.join(" / ")}
          </Text>
        )}
      </Box>

      {/* Animates out previous cue media, if any */}
      {previousScreenData && (
        <Box
          key={`previous-${cueStackKey(previousScreenData)}`}
          data-testid="outgoing-cue-layer"
          flex="1"
          display="flex"
          justifyContent="center"
          alignItems="center"
          position="absolute"
          inset="0"
          width="100%"
          height="100%"
          zIndex={1}
          animation={animStyle(exitAnim)}
        >
          {renderCueStack(previousScreenData)}
        </Box>
      )}

      {/* Animates in current cue media */}
      <Box
        key={`current-${cueStackKey(currentScreenData)}`}
        data-testid="incoming-cue-layer"
        flex="1"
        display="flex"
        justifyContent="center"
        alignItems="center"
        position="absolute"
        inset="0"
        width="100%"
        height="100%"
        zIndex={1}
        color="white"
        animation={animStyle(enterAnim)}
      >
        {renderCueStack(currentScreenData)}
      </Box>
    </Box>
  )
}

const Screen = ({
  screenNumber,
  screenData,
  isVisible,
  onClose,
  transitionType,
}) => {
  const windowRef = useRef(null)
  const [isWindowReady, setIsWindowReady] = useState(false)
  const [currentScreenData, setCurrentScreenData] = useState(null)
  const [previousScreenData, setPreviousScreenData] = useState(null)
  const [showText, setShowText] = useState(false)
  const [emotionCache, setEmotionCache] = useState(null)

  // Function to copy the dynamic Chakra styles from the parent document to the new window
  const copyChakraStyles = () => {
    const parentStyles = document.querySelectorAll("style[data-emotion]") // Chakra UI styles are inside <style data-emotion> tags
    parentStyles.forEach((style) => {
      if (windowRef.current) {
        windowRef.current.document.head.appendChild(style.cloneNode(true)) // Clone the dynamic styles into the new window
      }
    })
  }

  useEffect(() => {
    if (isVisible) {
      if (!windowRef.current) {
        const newWindow = window.open(
          "",
          `Screen ${screenNumber}`,
          "width=800,height=600"
        )
        windowRef.current = newWindow
        setIsWindowReady(true)

        // Reset default browser margins in the new window to avoid the 8px offset.
        if (newWindow?.document?.documentElement?.style) {
          const { document: doc } = newWindow
          doc.documentElement.style.margin = "0"
          doc.documentElement.style.padding = "0"
          doc.documentElement.style.width = "100%"
          doc.documentElement.style.height = "100%"
          doc.documentElement.style.overflow = "hidden"
          if (doc.body?.style) {
            doc.body.style.margin = "0"
            doc.body.style.padding = "0"
            doc.body.style.width = "100%"
            doc.body.style.height = "100%"
            doc.body.style.overflow = "hidden"
          }
        }

        // Handle window close event to reset the reference
        newWindow.addEventListener("beforeunload", () => {
          windowRef.current = null
          onClose(screenNumber)
          setIsWindowReady(false)
          setEmotionCache(null)
          setCurrentScreenData(null)
          setPreviousScreenData(null)
        })
      }
    }

    if (!isVisible && windowRef.current) {
      windowRef.current.close()
      windowRef.current = null
      setIsWindowReady(false)
      setEmotionCache(null)
      setCurrentScreenData(null)
      setPreviousScreenData(null)
    }

    // Cleanup on unmount
    return () => {
      if (windowRef.current) {
        windowRef.current.close()
        windowRef.current = null
        setIsWindowReady(false)
        setEmotionCache(null)
        setCurrentScreenData(null)
        setPreviousScreenData(null)
        onClose(screenNumber)
      }
    }
  }, [isVisible, screenNumber, onClose])

  useEffect(() => {
    if (windowRef.current && !emotionCache) {
      // Set up a cache to inject Emotion's styles to portal (e.g. fadeOut and fadeIn effects)
      const cache = createCache({
        key: "new-window",
        container: windowRef.current.document.head,
      })
      setEmotionCache(cache)
    }
  }, [isWindowReady, emotionCache])

  useEffect(() => {
    // After the window is ready, copy the Chakra styles
    if (isWindowReady && windowRef.current) {
      copyChakraStyles()
    }
  }, [isWindowReady])

  useEffect(() => {
    // Update media states when screenData changes
    const nextScreenData = normalizeCueStack(screenData)

    if (!isWindowReady && !windowRef.current) {
      return
    }

    if (nextScreenData.length > 0) {
      if (!currentScreenData) {
        setPreviousScreenData(null)
        setCurrentScreenData(nextScreenData)
      } else {
        if (cueStackKey(currentScreenData) === cueStackKey(nextScreenData)) {
          return
        }

        setPreviousScreenData(currentScreenData)
        setCurrentScreenData(nextScreenData)
      }
    } else if (currentScreenData && cueStackKey(currentScreenData) !== "") {
      setPreviousScreenData(currentScreenData)
      setCurrentScreenData([])
    }
    const firstCue = nextScreenData[0]
    windowRef.current.document.title = `Screen ${screenNumber} • ${firstCue?.index === 0 ? "Starting Frame" : `Frame ${firstCue?.index ?? ""}`}`
  }, [screenData, currentScreenData, isWindowReady, screenNumber])

  // Listeners for shift-press to show screen data on screens
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Shift") {
        setShowText(true)
      }
    }

    const handleKeyUp = (event) => {
      if (event.key === "Shift") {
        setShowText(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [])

  // Only render the portal when the window is ready
  return windowRef.current &&
    isWindowReady &&
    emotionCache &&
    (currentScreenData || previousScreenData)
    ? ReactDOM.createPortal(
        //inject Emotion styles to portal (e.g. fadeOut, fadeIn effects)
        <CacheProvider value={emotionCache}>
          <ScreenContent
            screenNumber={screenNumber}
            currentScreenData={currentScreenData}
            previousScreenData={previousScreenData}
            showText={showText}
            transitionType={transitionType}
          />
        </CacheProvider>,
        windowRef.current.document.body // render to new window's document.body
      )
    : null
}

export default Screen
