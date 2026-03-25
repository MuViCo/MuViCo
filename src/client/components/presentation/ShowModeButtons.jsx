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
      <Button
        colorScheme={isAutoplaying ? "red" : "blue"}
        onClick={toggleAutoplay}
        leftIcon={
          <img
            src={isAutoplaying ? pausebutton : playbutton}
            alt=""
            width="40"
            height="40"
            aria-hidden="true"
          />
        }
      >
      </Button>
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
          aria-label="Keyboard Shortcuts"
          icon={<QuestionIcon />}
          size="lg"
          variant="ghost"
          colorScheme="purple"
        />
      </ClickablePopover>


    </Box>
  )
}

const AutoplayInterval = ({ autoplayInterval }) => (
  <Box display="flex" alignItems="center" gap="10px">
    <NumberInput
      id="autoplaytime"
      value={autoplayInterval}
      width="100px"
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
    <Box display="flex" flexDirection="column" gap={2}>
      <Button
        colorScheme={hasOpenScreen ? "red" : "blue"}
        onClick={toggleAllScreens}
        size="md"
      >
        {hasOpenScreen ? "Close all screens" : "Open all screens"}
      </Button>
      <Box display="flex" flexWrap="wrap" gap={2}>
        {allScreenNumbers
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
          ))}
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
    icon={<img src={previousbutton} alt="" width="40" height="40" aria-hidden="true" />}
    onClick={() => updateCue("Previous")}
    colorScheme="purple"
    isDisabled={cueIndex === 0}
  />
)

const CueNavigationNext = ({ cueIndex, updateCue, indexCount }) => (
  <IconButton
    aria-label="Next Cue"
    icon={<img src={nextbutton} alt="" width="40" height="40" aria-hidden="true" />}
    onClick={() => updateCue("Next")}
    colorScheme="purple"
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
  toggleAutoplayInterval
}) => (

  <Box display="flex" flexDirection="row" alignItems="left" gap={4} mt={4}>
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
    <CueNavigationPrevious cueIndex={cueIndex} updateCue={updateCue} indexCount={indexCount} />
    <Heading size="md">{cueIndex === 0 ? "" : `Frame ${cueIndex}`}</Heading>

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
    <AutoplayInterval autoplayInterval={autoplayInterval} />
  </Box>
)

export default ShowModeButtons
