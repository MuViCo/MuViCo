import React, { useState, useEffect, forwardRef } from "react"
import { Button, Box } from "@chakra-ui/react"

const FullScreen = forwardRef(({ buttonLabel, exitLabel, children }, ref) => {
  const [isFullScreen, setIsFullScreen] = useState(false)

  const toggleFullScreen = () => {
    if (!isFullScreen) {
      const e = document.getElementById("my-fullscreen")
      e?.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
    setIsFullScreen(!isFullScreen)
  }

  return (
    <Box>
      <Button onClick={toggleFullScreen}>
        {isFullScreen ? exitLabel : buttonLabel}
      </Button>
      {isFullScreen && <Box id="my-fullscreen">{children}</Box>}
    </Box>
  )
})

export default FullScreen
