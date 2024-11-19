import React, { useEffect, useRef, useState } from "react"
import ReactDOM from "react-dom"
import { Box, Image, Text } from "@chakra-ui/react"


const ScreenContent = ({ screenNumber, screenData, showText }) => (
  <Box bg="black" color="white" width="100vw" height="100vh" display="flex" flexDirection="column">
    {/* Header with Screen Number on the left and Cue Name on the right */}
    <Box display="flex" justifyContent="space-between" alignItems="center" position="absolute" width="90vw" left="5vw" zIndex={1}>
      <Text fontSize="xl" textShadow='1px 0 2px #000000' style={{visibility: showText ? "visible" : "hidden"}}>
        Screen {screenNumber}
      </Text>
      {screenData && (
        <Text fontSize="xl" textShadow='1px 0 2px #000000' style={{visibility: showText ? "visible" : "hidden"}}>
          Cue Name: {screenData.name}
        </Text>
      )}
    </Box>

    {/* Main Content Section for Image or Fallback Text */}
    <Box flex="1" display="flex" justifyContent="center" alignItems="center" position="absolute" width="100vw" zIndex={0}>
      {screenData?.file?.url ? (
        <Image 
          src={screenData.file.url} 
          alt={screenData.name} 
          width="100%" 
          height="100vh" 
          objectFit="contain"
        />
      ) : (
        <Text>No media available for this cue.</Text>
      )}
    </Box>
  </Box>
)

const Screen = ({ screenNumber, screenData, isVisible, onClose }) => {
  const windowRef = useRef(null)
  const [isWindowReady, setIsWindowReady] = useState(false)
  const [previousScreenData, setPreviousScreenData] = useState(null)
  const [showText, setShowText] = useState(false)

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
        const newWindow = window.open("", `Screen ${screenNumber}`, "width=800,height=600")

        windowRef.current = newWindow
        setIsWindowReady(true)

        // Handle window close event to reset the reference
        newWindow.addEventListener("beforeunload", () => {
          windowRef.current = null
          onClose(screenNumber)
          setIsWindowReady(false)
        })
      }
    }

    if (!isVisible && windowRef.current) {
      windowRef.current.close()
      windowRef.current = null
      setIsWindowReady(false)
    }

    // Cleanup on unmount
    return () => {
      if (windowRef.current) {
        windowRef.current.close()
        windowRef.current = null
        setIsWindowReady(false)
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
    // Update the previous screen data if new screen data is available
    if (screenData) {
      setPreviousScreenData(screenData)
    }
  }, [screenData])

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
  return windowRef.current && isWindowReady && (screenData || previousScreenData)
    ? ReactDOM.createPortal(
          <ScreenContent screenNumber={screenNumber} screenData={screenData || previousScreenData} showText={showText} />,
        windowRef.current.document.body // render to new window's document.body
      )
    : null
}

export default Screen
