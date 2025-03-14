import React, { useEffect, useRef, useState } from "react"
import ReactDOM from "react-dom"
import { Box, Image, Text } from "@chakra-ui/react"
import { isImage } from "../utils/fileTypeUtils"
import { keyframes } from "@emotion/react"

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`

const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`

const ScreenContent = ({
  screenNumber,
  currentScreenData,
  previousScreenData,
  showText,
  shouldAnimatePrevious,
  handleFadeOutEnd,
}) => (
  <Box
    zIndex={3}
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

    {/* Fade in current cue media */}
    <Box
      flex="1"
      display="flex"
      justifyContent="center"
      alignItems="center"
      position="absolute"
      width="100vw"
      zIndex={1}
      animation={`${fadeIn} 500ms ease-in-out forwards`}
      key={`${currentScreenData?._id}-${currentScreenData?.index}-${currentScreenData?.screen}`}
    >
      {currentScreenData?.file?.url ? (
        // If data is an image
        isImage(currentScreenData.file) ? (
          <Image
            src={currentScreenData.file.url}
            alt={currentScreenData.name}
            width="100%"
            height="100vh"
            objectFit="contain"
          />
        ) : (
          // If data is a video
          <video
            src={currentScreenData.file.url}
            width="100%"
            height="100%"
            autoPlay
            loop
            muted
            style={{ objectFit: "contain" }}
          />
        )
      ) : (
        // If no data
        <Text>No media available for this cue.</Text>
      )}
    </Box>

    {/* Fade out previous cue media, if applicable */}
    {shouldAnimatePrevious && (
      <Box
        flex="1"
        display="flex"
        justifyContent="center"
        alignItems="center"
        position="absolute"
        width="100vw"
        zIndex={0}
        animation={`${fadeOut} 500ms ease-in-out forwards`}
        key={`${previousScreenData?._id}-${previousScreenData?.index}-${previousScreenData?.screen}`}
        onAnimationEnd={handleFadeOutEnd}
      >
        {previousScreenData?.file?.url ? (
          // If data is an image
          isImage(previousScreenData.file) ? (
            <Image
              src={previousScreenData.file.url}
              alt={previousScreenData.name}
              width="100%"
              height="100vh"
              objectFit="contain"
            />
          ) : (
            // If data is a video
            <video
              src={previousScreenData.file.url}
              width="100%"
              height="100%"
              autoPlay
              loop
              muted
              style={{ objectFit: "contain" }}
            />
          )
        ) : (
          // If no data
          <Text>No media available for this cue.</Text>
        )}
      </Box>
    )}
  </Box>
)

const Screen = ({ screenNumber, screenData, isVisible, onClose }) => {
  const windowRef = useRef(null)
  const [isWindowReady, setIsWindowReady] = useState(false)
  const [currentScreenData, setCurrentScreenData] = useState(null)
  const [previousScreenData, setPreviousScreenData] = useState(null)
  const [showText, setShowText] = useState(false)
  const [shouldAnimatePrevious, setShouldAnimatePrevious] = useState(false)
  const [hasBeenOpened, setHasBeenOpened] = useState(false)

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

        // Set `shouldAnimatePrevious` only if the screen has been opened before
        if (hasBeenOpened) {
          setShouldAnimatePrevious(true)
        } else {
          setShouldAnimatePrevious(false)
          setHasBeenOpened(true) // Mark the screen as opened
        }

        // Handle window close event to reset the reference
        newWindow.addEventListener("beforeunload", () => {
          windowRef.current = null
          onClose(screenNumber)
          setIsWindowReady(false)
          setHasBeenOpened(false)
          setShouldAnimatePrevious(false)
        })
      }
    }

    if (!isVisible && windowRef.current) {
      windowRef.current.close()
      windowRef.current = null
      setIsWindowReady(false)
      setHasBeenOpened(false)
      setShouldAnimatePrevious(false)
    }

    // Cleanup on unmount
    return () => {
      if (windowRef.current) {
        windowRef.current.close()
        windowRef.current = null
        setIsWindowReady(false)
        setHasBeenOpened(false)
        setShouldAnimatePrevious(false)
        onClose(screenNumber)
      }
    }
  }, [isVisible, screenNumber, onClose])

  useEffect(() => {
    // After the window is ready, copy the Chakra styles
    if (isWindowReady && windowRef.current) {
      copyChakraStyles()
    }
  }, [isWindowReady])

  useEffect(() => {
    if (screenData && screenData !== currentScreenData) {
      if (!currentScreenData) {
        setCurrentScreenData(screenData)
        setPreviousScreenData(null)
      } else {
        setPreviousScreenData(currentScreenData)
        setCurrentScreenData(screenData)
        console.log("")
        console.log("screendata", screenData)
        console.log("current screen data", currentScreenData)
        console.log("previous screen data", previousScreenData)
        // Only animate transition if the screen has been opened before
        setShouldAnimatePrevious(true)

        // Fallback timeout to remove previous screen if onAnimationEnd doesn't fire
        setTimeout(() => {
          setPreviousScreenData(null)
          setShouldAnimatePrevious(false)
        }, 100) // Match animation duration
      }
    }
  }, [screenData])

  // Function to handle fade-out completion
  const handleFadeOutEnd = () => {
    console.log("handle fade out end")
    setPreviousScreenData(null) // Remove previous screen data after fade-out
    setShouldAnimatePrevious(false) // Stop animation flag
  }

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
    (currentScreenData || previousScreenData)
    ? ReactDOM.createPortal(
        <ScreenContent
          screenNumber={screenNumber}
          currentScreenData={currentScreenData}
          previousScreenData={previousScreenData}
          showText={showText}
          shouldAnimatePrevious={shouldAnimatePrevious}
          handleFadeOutEnd={handleFadeOutEnd}
        />,
        windowRef.current.document.body // render to new window's document.body
      )
    : null
}

export default Screen
