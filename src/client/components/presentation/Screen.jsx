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



//conditional rendering helper function based on file type
const renderMedia = (file, name, color) => {
  if (isType.image(file)) {
    // Handle blank images by using local file path when URL is null
    // This is intended to be temporary until blank files are replaced in the database with actual color values and the blank file type is removed
    // TODO: Refactor to remove blank file type and use color value directly from cue data instead of relying on file name parsing
    if (file.name.includes("blank")) {
      if (file.name.includes("blank-black")) {
        return (
          <Image
            bg="#000000"
            alt={name}
            width="100%"
            height="100vh"
            objectFit="cover"
          />
        )
      }
      if (file.name.includes("blank-white")) {
        return (
          <Image
            bg="#ffffff"
            alt={name}
            width="100%"
            height="100vh"
            objectFit="cover"
          />
        )
      }
      if (file.name.includes("blank-indigo")) {
        return (
          <Image
            bg="#5700a3"
            alt={name}
            width="100%"
            height="100vh"
            objectFit="cover"
          />
        )
      }
      if (file.name.includes("blank-tropical-indigo")) {
        return (
          <Image
            bg="#8f94f6"
            alt={name}
            width="100%"
            height="100vh"
            objectFit="cover"
          />
        )
      }
    // show other images as normal  
    } else {
      const imageSrc = file.url || `/${file.name}`
        return (
          <Image
            src={imageSrc}
            alt={name}
            width="100%"
            height="100vh"
            objectFit="cover"
          />
        )
  }
  // check if media is video
  if (isType.video(file)) {
    return (
      <video
        src={file.url}
        width="100%"
        height="100%"
        autoPlay
        loop
        muted
        style={{ objectFit: "contain" }}
      />
    )
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
else {
        return (
          <Image
            bg={color}
            // alt={name}
            width="100%"
            height="100vh"
            objectFit="cover"
          />
        )
  }  
  // return <Text>Unsupported media type.</Text>
}
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

  return (
    <Box
      bg="black"
      color="white"
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
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
      {currentScreenData && (
        <Text
          fontSize="xl"
          textShadow="1px 0 2px #000000"
          style={{ visibility: showText ? "visible" : "hidden" }}
        >
          Element Name: {currentScreenData.name}
        </Text>
      )}
    </Box>

    {/* Animates out previous cue media, if any */}
    {previousScreenData && (
      <Box
        key={`${previousScreenData._id}-${previousScreenData.index}-${previousScreenData.screen}-${transitionType}`}
        flex="1"
        display="flex"
        justifyContent="center"
        alignItems="center"
        position="absolute"
        width="100vw"
        zIndex={1}
        animation={animStyle(exitAnim)}
      >
        {(previousScreenData.file?.url || previousScreenData.file?.name) &&
          (isType.image(previousScreenData.file) ? (
            <Image
              src={previousScreenData.file.url || `/${previousScreenData.file.name}`}
              alt={previousScreenData.name}
              width="100%"
              height="100vh"
              objectFit="contain"
            />
          ) : (
            <video
              src={previousScreenData.file.url}
              width="100%"
              height="100%"
              autoPlay
              loop
              muted
              style={{ objectFit: "contain" }}
            />
          ))}
      
      </Box>
    )}

    {/* Animates in current cue media */}
    <Box
      key={`${currentScreenData?._id}-${currentScreenData?.index}-${currentScreenData?.screen}-${transitionType}`}
      flex="1"
      display="flex"
      justifyContent="center"
      alignItems="center"
      position="absolute"
      width="100vw"
      zIndex={1}
      animation={animStyle(enterAnim)}
    >
      {currentScreenData?.file?.url ? (
        renderMedia(currentScreenData.file, currentScreenData.name, currentScreenData.color)
      ) : (
        <Text>No media available for this cue.</Text>
      )}
    </Box>
  </Box>
  )
}

const Screen = ({ screenNumber, screenData, isVisible, onClose, transitionType }) => {
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
  }, [windowRef.current, emotionCache])

  useEffect(() => {
    // After the window is ready, copy the Chakra styles
    if (isWindowReady && windowRef.current) {
      copyChakraStyles()
    }
  }, [isWindowReady])

  useEffect(() => {
    // Update media states when screenData changes
    if (screenData) {
      // Skip update if screen is closed
      if (!isWindowReady && !windowRef.current) {
        return
      }

      if (!currentScreenData) {
        setPreviousScreenData(null)
        setCurrentScreenData(screenData)
      } else {
        // Skip update if media URL, name or color hasn't changed
        if (
          currentScreenData?.file?.url === screenData?.file?.url &&
          currentScreenData?.name === screenData?.name &&
          currentScreenData?.color === screenData?.color
        ) {
          return
        }

        setPreviousScreenData(currentScreenData)
        setCurrentScreenData(screenData)
      }
    } windowRef.current.document.title = `Screen ${screenNumber} • ${screenData.index === 0 ? "Starting Frame" : `Frame ${screenData.index}`}` 
  }, [screenData, currentScreenData, isWindowReady])

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
