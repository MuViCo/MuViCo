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

  useEffect(() => {
    if (isVisible && !windowRef.current) {
      const newWindow = window.open("", `Screen ${screenNumber}`, "width=800,height=600")
      windowRef.current = newWindow

      // Clean up when the window is closed
      newWindow.addEventListener("beforeunload", () => {
        windowRef.current = null
      })

      // Clean up when the component is unmounted
      return () => {
        if (windowRef.current) {
          windowRef.current.close()
        }
      }
    }
  }, [isVisible, screenNumber])

  if (!isVisible || !windowRef.current) {
    return null
  }

  return ReactDOM.createPortal(
    <ScreenContent screenNumber={screenNumber} screenData={screenData} />,
    windowRef.current.document.body
  )
}

export default Screen