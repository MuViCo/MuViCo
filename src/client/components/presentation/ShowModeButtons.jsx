import React from "react"
import ClickablePopover from "../utils/ClickablePopover"

import {
  Button,
  Tooltip,
  Icon,
  Box,
  IconButton,
  Heading,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Text,
} from "@chakra-ui/react"
import {
  QuestionIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from "@chakra-ui/icons"
import nextbutton from "../../public/icons/nextbutton.svg"
import previousbutton from "../../public/icons/previousbutton.svg"
import pausebutton from "../../public/icons/pausebutton.svg"
import playbutton from "../../public/icons/playbutton.svg"



const DropdownButton = ({ screenNumber, screens, toggleScreenMirroring }) => {
  const allScreenNumbers = Object.keys(screens)

  return (
    <Menu>
      <MenuButton
        as={Button}
        colorScheme="gray"
        p={1}
        aria-label={`Dropdown for screen ${screenNumber}`}
      >
        <ChevronDownIcon />
      </MenuButton>
      <MenuList>
        <MenuItem onClick={() => toggleScreenMirroring(screenNumber, null)}>
          No mirroring
        </MenuItem>
        {allScreenNumbers
          .filter(
            (targetScreen) =>
              targetScreen !== screenNumber
          )
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
}


const AutoplayControls = ({
  autoplayInterval,
  toggleAutoplay,
  isAutoplaying,
  toggleAutoplayInterval,
}) => {

  return (
    <Box display="flex" alignItems="center">
      <IconButton
        aria-label={isAutoplaying ? "Stop Autoplay" : "Start Autoplay"}
        onClick={toggleAutoplay}
        p={0}
        className={`show-mode-autoplay-btn ${isAutoplaying ? "show-mode-autoplay-btn-stop" : "show-mode-autoplay-btn-start"}`}
        icon={
          <img
            src={isAutoplaying ? pausebutton : playbutton}
            alt=""
            width="35"
            height="35"
            aria-hidden="true"
          />
        }
      />
      {/* <NumberInput
       id="autoplaytime"
       value={autoplayInterval}
       width="100px"
       onChange={(valueString) => toggleAutoplayInterval(valueString)}
       min={0.1}
       step={0.1}
      >
        <NumberInputField placeholder="sec" />
        <NumberInputStepper>
          <NumberIncrementStepper />
          <NumberDecrementStepper />
        </NumberInputStepper>
      </NumberInput> */}
      {/* <Text fontSize="sm" fontWeight="bold">sec / frame</Text> */}
    </Box>
  )
}

const AutoplayInterval = ({ autoplayInterval, toggleAutoplayInterval }) => (
  <Box display="flex" alignItems="center" gap="10px">
    <NumberInput
      id="autoplaytime"
      value={autoplayInterval}
      width="100px"
      onChange={(valueString) => toggleAutoplayInterval(valueString)}
      min={0.1}
      step={0.1}
    >
      <NumberInputField placeholder="sec" />
      <NumberInputStepper>
        <NumberIncrementStepper />
        <NumberDecrementStepper />
      </NumberInputStepper>
    </NumberInput>
    <Text fontSize="sm" fontWeight="bold">sec / frame</Text>
  </Box>
)


const ScreenToggleButtons = ({
  screens,
  toggleScreenVisibility,
  toggleScreenMirroring,
  toggleAllScreens,
  mirroring,
}) => {

  const allScreenNumbers = Object.keys(screens)

  const hasOpenScreen = allScreenNumbers
    .some((screenNumber) => screens[screenNumber])

  return (
    <Box display="flex" flexDirection="row" alignItems="center" gap={2}>
      <Button
        onClick={toggleAllScreens}
        size="md"
        className={`show-mode-open-all-btn ${hasOpenScreen ? "show-mode-open-all-btn-close" : "show-mode-open-all-btn-open"}`}
      >
        {hasOpenScreen ? "Close all screens" : "Open all screens"}
      </Button>
      <Box display="flex" flexWrap="wrap" gap={2} alignItems="center">
        {/* {allScreenNumbers
          .map((screenNumber) => (
            <Box key={screenNumber}>
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
          ))} */}
      </Box>
    </Box>
  )
}

// // Component for rendering the cue navigation buttons
// const CueNavigationButtons = ({ cueIndex, updateCue, indexCount }) => (
//   <Box display="flex" gap={4} alignItems="center">

//     <IconButton
//       aria-label="Previous Cue"
//       icon={<ChevronLeftIcon />}
//       onClick={() => updateCue("Previous")}
//       colorScheme="purple"
//       isDisabled={cueIndex === 0}
//     />

//     <Heading size="md">{cueIndex === 0 ? "" : `Frame ${cueIndex}`}</Heading>

//     <IconButton
//       aria-label="Next Cue"
//       icon={<ChevronRightIcon />}
//       onClick={() => updateCue("Next")}
//       colorScheme="purple"
//       isDisabled={cueIndex === indexCount - 1}
//     />



//   </Box>
// )

const CueNavigationPrevious = ({ cueIndex, updateCue, indexCount }) => (
  <IconButton
    aria-label="Previous Cue"
    icon={<img src={previousbutton} alt="" width="35" height="35" aria-hidden="true" />}
    className="show-mode-nav-btn"
    onClick={() => updateCue("Previous")}
    isDisabled={cueIndex === 0}
  />
)

const CueNavigationNext = ({ cueIndex, updateCue, indexCount }) => (
  <IconButton
    aria-label="Next Cue"
    icon={<img src={nextbutton} alt="" width="35" height="35" aria-hidden="true" />}
    className="show-mode-nav-btn"
    onClick={() => updateCue("Next")}
    isDisabled={cueIndex === indexCount - 1}
  />
)




// ShowModeButtons component to handle screen visibility and cue navigation
const ShowModeButtons = ({
  screens,
  toggleScreenVisibility,
  toggleScreenMirroring,
  toggleAllScreens,
  mirroring,
  cueIndex,
  updateCue,
  indexCount,
  autoplayInterval,
  toggleAutoplay,
  isAutoplaying,
  toggleAutoplayInterval,
  audioTimeLabel,
}) => (

  <Box bg="" display="flex" flexDirection="row" alignItems="center" justifyContent="left" gap={4} ml={2.5} mt={1.5}>
    <CueNavigationPrevious cueIndex={cueIndex} updateCue={updateCue} indexCount={indexCount} />
    <Box w="150px" display="flex" justifyContent="center" >
      <Heading size="md" textAlign="center" whiteSpace="nowrap">
        {cueIndex > 0 ? `Frame ${cueIndex}` : "Frame 0"}
      </Heading>
    </Box>

    <AutoplayControls
      autoplayInterval={autoplayInterval}
      toggleAutoplay={toggleAutoplay}
      isAutoplaying={isAutoplaying}
      toggleAutoplayInterval={toggleAutoplayInterval}
    />
    <CueNavigationNext cueIndex={cueIndex} updateCue={updateCue} indexCount={indexCount} />
    <ScreenToggleButtons
      screens={screens}
      toggleScreenVisibility={toggleScreenVisibility}
      toggleScreenMirroring={toggleScreenMirroring}
      toggleAllScreens={toggleAllScreens}
      mirroring={mirroring}
    />

    <AutoplayInterval
      autoplayInterval={autoplayInterval}
      toggleAutoplayInterval={toggleAutoplayInterval}
    />
    <ClickablePopover
      label={
        <>
          <b>Autoplay</b>
          <br /><br />
          Each frame is displayed for the number of seconds you enter in the box.
          <br /><br />
          Open the wanted screens and click “Start Autoplay” to begin playing the frames automatically.
          Autoplay always starts from the Starting Frame.
          <br /><br />
          You can also switch the frames manually and change the sec/frame during the Autoplay.
          <br /><br />
          Autoplay stops automatically after the last frame.
          You can stop it manually at anytime by clicking “Stop Autoplay.”
        </>
      }
      placement="top"
      fontSize="sm"
    >
      <IconButton
        aria-label="Autoplay Help"
        icon={<QuestionIcon />}
        size="lg"
        variant="ghost"
        colorScheme="purple"
      />
    </ClickablePopover>
    <ClickablePopover
      label={
        <>
          Make sure this window is in focus!
          <br />
          <br />
          You can use the following keyboard shortcuts:
          <br />
          <br />
          Next index: → ArrowRight, ↑ ArrowUp, PageDown
          <br />
          <br />
          Previous index: ← ArrowLeft, ↓ ArrowDown, PageUp
        </>
      }
      placement="top"
      fontSize="sm"
    >
      <IconButton
        aria-label="Keyboard Shortcuts"
        icon={<QuestionIcon />}
        size="lg"
        variant="ghost"
        colorScheme="purple"
      />
    </ClickablePopover>
        {audioTimeLabel && (
      <Box
        as="span"
        fontSize="xs"
        fontWeight="medium"
        color="gray.500"
        whiteSpace="nowrap"
      >
        Audio: {audioTimeLabel}
      </Box>
    )}
  </Box>
)

export default ShowModeButtons
