import React from "react"
import { Button, Box, IconButton, Heading, Menu, MenuButton, MenuList, MenuItem } from "@chakra-ui/react"
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from "@chakra-ui/icons"

const DropdownButton = ({ screenNumber, screens, toggleScreenMirroring }) => (
  <Menu>
    <MenuButton as={Button} colorScheme="gray" p={1} aria-label={`Dropdown for screen ${screenNumber}`}>
      <ChevronDownIcon />
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
)

// Component for rendering the screen toggle buttons
const ScreenToggleButtons = ({ screens, toggleScreenVisibility, toggleScreenMirroring, mirroring }) => (
  <Box display="flex" flexWrap="wrap" gap={2}>
    {Object.keys(screens).map((screenNumber) => (
      <Box
        key={screenNumber}>
        <Button
          colorScheme={screens[screenNumber] ? "pink" : "purple"}
          onClick={() => toggleScreenVisibility(screenNumber)}
          m={2}
          flexDirection="column"
        >
          <Box>
            {screens[screenNumber]
              ? `Close screen: ${screenNumber}`
              : `Open screen: ${screenNumber}`}
          </Box>

          {mirroring[screenNumber] && (
            <Box fontSize="sm">
              (Mirroring screen: {mirroring[screenNumber]})
            </Box>
          )}
      </Button>
      <DropdownButton
        screenNumber={screenNumber}
        screens={screens}
        toggleScreenMirroring={toggleScreenMirroring}
    />
      </Box>
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
