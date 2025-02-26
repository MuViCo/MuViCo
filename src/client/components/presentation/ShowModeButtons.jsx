import React from "react"
import { Button, Box, IconButton, Heading, Select, Menu, MenuButton, MenuList, MenuItem } from "@chakra-ui/react"
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from "@chakra-ui/icons"

// Component for rendering the screen toggle buttons
const ScreenToggleButtons = ({ screens, toggleScreenVisibility, toggleScreenMirroring, mirroring }) => (
  <Box>
    {Object.keys(screens).map((screenNumber) => (
      <Menu key={screenNumber}>
        <MenuButton
          as={Button}
          rightIcon={<ChevronDownIcon />}
          colorScheme={screens[screenNumber] ? "pink" : "purple"}
          onClick={(event) => {
            if (event.target.tagName !== "BUTTON") return
            toggleScreenVisibility(screenNumber)}
          }
          m={2}
        >
          {mirroring[screenNumber]
            ? `Mirroring screen: ${mirroring[screenNumber]}`
            : screens[screenNumber]
            ? `Close screen: ${screenNumber}`
            : `Open screen: ${screenNumber}`}
        </MenuButton>
        <MenuList>
          <MenuItem onClick={() => toggleScreenMirroring(screenNumber, null)}>
            No mirroring
          </MenuItem>
          {Object.keys(screens)
            .filter((targetScreen) => targetScreen !== screenNumber)
            .map((targetScreen) => (
              <MenuItem
                key={targetScreen}
                onClick={() => toggleScreenMirroring(screenNumber, targetScreen)}
              >
                Mirror screen: {targetScreen}
              </MenuItem>
            ))}
        </MenuList>
      </Menu>
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
    <Heading size="md">Index {cueIndex}</Heading>
    <IconButton
      aria-label="Next Cue"
      icon={<ChevronRightIcon />}
      onClick={() => updateCue("Next")}
      colorScheme="purple"
    />
  </Box>
)

// ShowModeButtons component to handle screen visibility and cue navigation
const ShowModeButtons = ({
  screens,
  toggleScreenVisibility,
  toggleScreenMirroring,
  mirroring,
  cueIndex,
  updateCue,
}) => (
  <Box display="flex" flexDirection="column" alignItems="center" gap={4} mt={4}>
    <ScreenToggleButtons
      screens={screens}
      toggleScreenVisibility={toggleScreenVisibility}
      toggleScreenMirroring={toggleScreenMirroring}
      mirroring={mirroring}
    />
    <CueNavigationButtons cueIndex={cueIndex} updateCue={updateCue} />
  </Box>
)

export default ShowModeButtons
