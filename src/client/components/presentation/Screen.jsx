import React, { useEffect, useRef, useState } from "react"
import ReactDOM from "react-dom"
import { Box, Image, Text } from "@chakra-ui/react"

// ScreenContent now assumes ChakraProvider is already in place higher up in the component tree
const ScreenContent = ({ screenNumber, screenData }) => (
  <Box p={4}>
    <Text fontSize="2xl" fontWeight="bold">Screen {screenNumber}</Text>
    {screenData ? (
      <Box>
        <Text><strong>Cue Name:</strong> {screenData.name}</Text>
        {screenData.file?.url ? (
          <Image 
          src={screenData.file.url} 
          alt={screenData.name} 
          maxW="100vw"  // Image won't exceed viewport width
          height="auto" // Maintains the aspect ratio of the image
          objectFit="contain" // Makes sure the image is contained within the box
          />
        ) : (
          <Text>No media available for this cue.</Text>
        )}
      </Box>
    ) : (
      <Text>No data available for this screen.</Text>
    )}
  </Box>
)

const Screen = ({ screenNumber, screenData, isVisible }) => {
  const windowRef = useRef(null)
  const [isWindowReady, setIsWindowReady] = useState(false)

  useEffect(() => {
    if (isVisible) {
      // Reset isWindowReady to false before opening the window again
      setIsWindowReady(false)

      if (!windowRef.current) {
        const newWindow = window.open("", `Screen ${screenNumber}`, "width=800,height=600")
        windowRef.current = newWindow

        // Set window as ready once the container is available
        setIsWindowReady(true)

        // Handle window close event to reset the reference
        newWindow.addEventListener("beforeunload", () => {
          windowRef.current = null
          setIsWindowReady(false) // Reset the state when the window is closed
        })
      }
    }

    if (!isVisible && windowRef.current) {
      windowRef.current.close() // Close the window
      windowRef.current = null  // Reset the window reference
      setIsWindowReady(false)   // Reset readiness state
    }

    return () => {
      if (windowRef.current) {
        windowRef.current.close() // Ensure the window is closed on unmount
        windowRef.current = null
        setIsWindowReady(false)   // Reset readiness state on unmount
      }
    }
  }, [isVisible, screenNumber])

  // Use ReactDOM.createPortal to render content into the new window
  return windowRef.current && isWindowReady
    ? ReactDOM.createPortal(
      <ScreenContent screenNumber={screenNumber} screenData={screenData} />,
      windowRef.current.document.body
      )
    : null
}

export default Screen
