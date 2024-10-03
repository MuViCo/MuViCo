import React, { useEffect, useRef } from "react"
import ReactDOM from "react-dom"
import { ChakraProvider, Box, Image, Text } from "@chakra-ui/react"

const ScreenContent = ({ screenNumber, screenData }) => (
  <ChakraProvider>
    <Box p={4}>
      <Text fontSize="2xl" fontWeight="bold">Screen {screenNumber}</Text>
      {screenData ? (
        <Box>
          <Text><strong>Cue Name:</strong> {screenData.name}</Text>
          {screenData.file?.url ? (
            <Image src={screenData.file.url} alt={screenData.name} maxWidth="100%" />
          ) : (
            <Text>No media available for this cue.</Text>
          )}
        </Box>
      ) : (
        <Text>No data available for this screen.</Text>
      )}
    </Box>
  </ChakraProvider>
)

const Screen = ({ screenNumber, screenData, isVisible }) => {
  const windowRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (isVisible && !windowRef.current) {
      const newWindow = window.open("", `Screen ${screenNumber}`, "width=800,height=600")
      windowRef.current = newWindow


      // Create a container in the new window for React to render into
      const container = newWindow.document.createElement("div")
      newWindow.document.body.appendChild(container)
      containerRef.current = container

      // Clean up when the window is closed
      newWindow.addEventListener("beforeunload", () => {
        windowRef.current = null
      })
    }

    if (!isVisible && windowRef.current) {
      windowRef.current.close() // Close the window
      windowRef.current = null // Reset the window reference
    }

    return () => {
      if (windowRef.current) {
        windowRef.current.close()
        windowRef.current = null
      }
    }
  }, [isVisible, screenNumber])

  // Use ReactDOM.createPortal to render content into the new window
  return windowRef.current && containerRef.current
    ? ReactDOM.createPortal(
        <ScreenContent screenNumber={screenNumber} screenData={screenData} />,
        containerRef.current
      )
    : null
}

export default Screen

