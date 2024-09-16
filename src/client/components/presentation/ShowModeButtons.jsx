import React from "react"
import { Button, Box, IconButton, Heading } from "@chakra-ui/react"
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons"

// ScreenButtons component to handle screen visibility and cue navigation
const ShowModeButtons = ({ screens, toggleScreenVisibility, cueIndex, updateCue }) => (
    <Box display="flex" flexDirection="column" alignItems="center" gap={4} mt={4}>
      <Box>
        {/* Render buttons to toggle screen visibility */}
        {[...Array(screens.length)].map((_, index) => (
          <Button
            key={index}
            colorScheme={screens[index] ? "pink" : "purple"}
            onClick={() => toggleScreenVisibility(index + 1)}
            m={2}
          >
            {screens[index] ? `Close screen: ${index + 1}` : `Open screen: ${index + 1}`}
          </Button>
        ))}
      </Box>

      <Box display="flex" gap={4} alignItems="center">
        {/* Cue Navigation Buttons */}
        <IconButton
          aria-label="Previous Cue"
          icon={<ChevronLeftIcon />}
          onClick={() => updateCue("Previous")}
          colorScheme="purple"
        />
        <Heading size="md">Cue {cueIndex + 1}</Heading>
        <IconButton
          aria-label="Next Cue"
          icon={<ChevronRightIcon />}
          onClick={() => updateCue("Next")}
          colorScheme="purple"
        />
      </Box>
    </Box>
)

export default ShowModeButtons
