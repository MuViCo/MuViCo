import React from "react"
import { Button, Box, IconButton, Heading } from "@chakra-ui/react"
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons"

// Component for rendering the screen toggle buttons
const ScreenToggleButtons = ({ screens, toggleScreenVisibility }) => (
  <Box>
    {Object.keys(screens).map((screenNumber) => (
      <Button
        key={screenNumber}
        colorScheme={screens[screenNumber] ? "pink" : "purple"}
        onClick={() => toggleScreenVisibility(screenNumber)}
        m={2}
      >
        {screens[screenNumber] ? `Close screen: ${screenNumber}` : `Open screen: ${screenNumber}`}
      </Button>
    ))}
  </Box>
)


// Component for rendering the cue navigation buttons
const CueNavigationButtons = ({ cueIndex, updateCue }) => (
  <Box display="flex" gap={4} alignItems="center">
    {/* Cue Navigation Buttons */}
    <IconButton
      aria-label="Previous Cue"
      icon={<ChevronLeftIcon />}
      onClick={() => updateCue("Previous")}
      colorScheme="purple"
    />
    <Heading size="md">Cue {cueIndex}</Heading>
    <IconButton
      aria-label="Next Cue"
      icon={<ChevronRightIcon />}
      onClick={() => updateCue("Next")}
      colorScheme="purple"
    />
  </Box>
)

// ShowModeButtons component to handle screen visibility and cue navigation
const ShowModeButtons = ({ screens, toggleScreenVisibility, cueIndex, updateCue }) => (
  <Box display="flex" flexDirection="column" alignItems="center" gap={4} mt={4}>
    <ScreenToggleButtons screens={screens} toggleScreenVisibility={toggleScreenVisibility} />
    <CueNavigationButtons cueIndex={cueIndex} updateCue={updateCue} />
  </Box>
)

export default ShowModeButtons
