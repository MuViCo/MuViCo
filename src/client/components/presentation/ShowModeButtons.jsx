// ShowModeButtons.js
import React from "react"
import { Button, Box, Heading, IconButton } from "@chakra-ui/react"
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons"

const ScreenButtons = ({ screens, toggleScreenVisibility }) => (
  <>
      {[...Array(screens.length)].map((_, index) => (
          <Button
              key={index}
              colorScheme={screens[index] ? "pink" : "purple"}
              onClick={() => toggleScreenVisibility(index + 1)}
          >
              {screens[index] ? `Close screen: ${index + 1}` : `Open screen: ${index + 1}`}
          </Button>
      ))}
  </>
)

// ChangeCueButton component for navigating between cues
const ChangeCueButton = ({ updateCue, direction }) => (
  <>
      {direction === "Previous" ? (
          <IconButton
              aria-label="Previous Cue"
              icon={<ChevronLeftIcon />}
              onClick={() => updateCue("Previous")}
              colorScheme="purple"
              size="md"
          />
      ) : (
          <IconButton
              aria-label="Next Cue"
              icon={<ChevronRightIcon />}
              onClick={() => updateCue("Next")}
              colorScheme="purple"
              size="md"
          />
      )}
  </>
)

export default { ScreenButtons, ChangeCueButton }
