import React, { useState } from "react"
import screenfull from "screenfull"
import { Button, Box } from "@chakra-ui/react"

/**
 * Renders a fullscreen toggle button.
 * Not integrated with the rest of the app yet.
 *
 * @returns {JSX.Element} The fullscreen toggle component.
 */
const FullscreenToggle = () => {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const handleToggleFullscreen = () => {
    if (screenfull.isEnabled) {
      if (screenfull.isFullscreen) {
        screenfull.exit()
      } else {
        screenfull.request()
      }
      setIsFullscreen(!isFullscreen)
    }
  }

  return (
    <Box>
      <Button onClick={handleToggleFullscreen}>
        {isFullscreen ? "Exit Fullscreen" : "Go Fullscreen"}
      </Button>
    </Box>
  )
}

export default FullscreenToggle
