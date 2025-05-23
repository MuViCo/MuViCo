import React, { useEffect, useRef, useState } from "react"
import ReactDOM from "react-dom"
import { Box, Image, Text } from "@chakra-ui/react"
import { isType } from "../utils/fileTypeUtils"
import createCache from "@emotion/cache"
import { keyframes, CacheProvider } from "@emotion/react"

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`

const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`

//conditional rendering helper function based on file type
const renderMedia = (file, name) => {
  if (isType.image(file)) {
    return (
      <Image
        src={file.url}
        alt={name}
        width="100%"
        height="100vh"
        objectFit="contain"
      />
    )
  }
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
  if (isType.audio(file)) {
    return (
      <audio autoPlay loop controls style={{ width: "100%" }}>
        <source src={file.url} type={file.mimeType || "audio/mpeg"} />
        Your browser does not support the audio element.
      </audio>
    )
  }
  return <Text>Unsupported media type.</Text>
}

const ScreenContent = ({
  screenNumber,
  currentScreenData,
  previousScreenData,
  showText,
}) => (
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

    {/* Fade out previous cue media, if any */}
    {previousScreenData && (
      <Box
        key={`${previousScreenData._id}-${previousScreenData.index}-${previousScreenData.screen}`}
        flex="1"
        display="flex"
        justifyContent="center"
        alignItems="center"
        position="absolute"
        width="100vw"
        zIndex={1}
        animation={`${fadeOut} 500ms ease-in-out forwards`}
      >
        {previousScreenData.file?.url &&
          (isType.image(previousScreenData.file) ? (
            <Image
              src={previousScreenData.file.url}
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

    {/* Fade in current cue media */}
    <Box
      key={`${currentScreenData?._id}-${currentScreenData?.index}-${currentScreenData?.screen}`}
      flex="1"
      display="flex"
      justifyContent="center"
      alignItems="center"
      position="absolute"
      width="100vw"
      zIndex={1}
      animation={`${fadeIn} 500ms ease-in-out forwards`}
    >
      {currentScreenData?.file?.url ? (
        renderMedia(currentScreenData.file, currentScreenData.name)
      ) : (
        <Text>No media available for this cue.</Text>
      )}
    </Box>
  </Box>
)

const Screen = ({ screenNumber, screenData, isVisible, onClose }) => {
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
        // Skip update if media URL and name hasn't changed
        if (
          currentScreenData?.file?.url === screenData?.file?.url &&
          currentScreenData?.name === screenData?.name
        ) {
          return
        }

        setPreviousScreenData(currentScreenData)
        setCurrentScreenData(screenData)
      }
    }
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
          />
        </CacheProvider>,
        windowRef.current.document.body // render to new window's document.body
      )
    : null
}

export default Screen
