import React from "react"
import ClickablePopover from "../utils/ClickablePopover"

import {
  Button,
  Box,
  IconButton,
  Heading,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Text,
} from "@chakra-ui/react"
import {
  QuestionIcon,
} from "@chakra-ui/icons"
import nextbutton from "../../public/icons/nextbutton.svg"
import previousbutton from "../../public/icons/previousbutton.svg"
import pausebutton from "../../public/icons/pausebutton.svg"
import playbutton from "../../public/icons/playbutton.svg"

const AutoplayControls = ({
  toggleAutoplay,
  isAutoplaying,
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
  toggleAllScreens,
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
    </Box>
  )
}

const CueNavigationPrevious = ({ cueIndex, updateCue }) => (
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

// Shared playback controls for presentation navigation and autoplay.
const PresentationPlaybackControls = ({
  screens,
  toggleAllScreens,
  cueIndex,
  updateCue,
  indexCount,
  autoplayInterval,
  toggleAutoplay,
  isAutoplaying,
  toggleAutoplayInterval,
  audioSourceURL,
}) => (

  <Box bg="" display="flex" flexDirection="row" alignItems="center" justifyContent="left" gap={4} ml={2.5} mt={1.5}>
    <CueNavigationPrevious cueIndex={cueIndex} updateCue={updateCue} />
    <Box w="150px" display="flex" justifyContent="center" >
      <Heading size="md" textAlign="center" whiteSpace="nowrap">
        {cueIndex > 0 ? `Frame ${cueIndex}` : "Frame 0"}
      </Heading>
    </Box>

    <AutoplayControls
      toggleAutoplay={toggleAutoplay}
      isAutoplaying={isAutoplaying}
    />
    <CueNavigationNext cueIndex={cueIndex} updateCue={updateCue} indexCount={indexCount} />
    <ScreenToggleButtons
      screens={screens}
      toggleAllScreens={toggleAllScreens}
    />

    <AutoplayInterval
      autoplayInterval={autoplayInterval}
      toggleAutoplayInterval={toggleAutoplayInterval}
    />
    {audioSourceURL ? (
      <audio autoPlay loop controls src={audioSourceURL}></audio>
    ) : null}
  </Box>
)

export default PresentationPlaybackControls
