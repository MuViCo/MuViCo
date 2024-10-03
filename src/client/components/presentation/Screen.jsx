import React, { useEffect, useRef, useState } from "react"
import ReactDOM from "react-dom"
import { Box, ChakraProvider, Image, Text } from "@chakra-ui/react"
import theme from "../../lib/theme"
import Fonts from "../../lib/fonts"


// ScreenContent with Chakra styling applied directly through props
const ScreenContent = ({ screenNumber, screenData }) => (
  <Box p={4} bg="white" color="black" width="100vw" height="100vh" display="flex" flexDirection="column">
    {/* Header with Screen Number on the left and Cue Name on the right */}
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
      <Text fontSize="2xl" fontWeight="bold">Screen {screenNumber}</Text>
      {screenData && (
        <Text fontSize="lg" textAlign="right">
          <strong>Cue Name:</strong> {screenData.name}
        </Text>
      )}
    </Box>

    {/* Main Content Section for Image or Fallback Text */}
    <Box flex="1" display="flex" justifyContent="center" alignItems="center">
      {screenData?.file?.url ? (
        <Image 
          src={screenData.file.url} 
          alt={screenData.name} 
          maxW="80vw" 
          maxH="80vh" 
          objectFit="contain"
        />
      ) : (
        <Text>No media available for this cue.</Text>
      )}
    </Box>
  </Box>
)

const Screen = ({ screenNumber, screenData, isVisible }) => {
  const windowRef = useRef(null)
  const [isWindowReady, setIsWindowReady] = useState(false)

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
      }
    }
  }, [isVisible, screenNumber])

  useEffect(() => {
    // After the window is ready, copy the Chakra styles
    if (isWindowReady && windowRef.current) {
      copyChakraStyles()
    }
  }, [isWindowReady])

  // Only render the portal when the window is ready
  return windowRef.current && isWindowReady
    ? ReactDOM.createPortal(
        // Render the ChakraProvider in the new window
        <ChakraProvider theme={theme}>
          <Fonts />
            <ScreenContent screenNumber={screenNumber} screenData={screenData} />
        </ChakraProvider>,
        windowRef.current.document.body // render to new window's document.body
      )
    : null
}

export default Screen
