import {
  Text,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Box,
  Button,
} from "@chakra-ui/react"

import {
  editModeFeaturesData,
  stepsToAddElementData,
  editingElementData,
  screenAndPlaybackData,
} from "../data/presentationPageData"

import FeatureSection from "../utils/FeatureSection"

const PresentationManual = () => {
  return (
    <>
      <Text mb={4}>
        Welcome to the user manual. This modal provides guidance on how to use
        the editor.
        <br/>
        <br/>
        <Button
          onClick={(e) => {
            e.preventDefault()
            localStorage.removeItem("hasSeenHelp_presentation")
            window.location.reload()
          }}
        >
          Restart the tutorial
        </Button>
      </Text>

      <Accordion allowMultiple>
        {/* Presentation basics */}
        <AccordionItem>
          <h2>
            <AccordionButton>
              <Box flex="1" textAlign="left" fontWeight="bold" fontSize="2xl">
                Presentation basics
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <FeatureSection
              title="How to navigate the editor"
              data={editModeFeaturesData}
            />
          </AccordionPanel>
        </AccordionItem>

        {/* Adding an element */}
        <AccordionItem>
          <h2>
            <AccordionButton>
              <Box flex="1" textAlign="left" fontWeight="bold" fontSize="2xl">
                Add a new element
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <FeatureSection
              title="Steps to add a new element"
              data={stepsToAddElementData}
              listAs="ol"
              listStyleType="inside"
            />
          </AccordionPanel>
        </AccordionItem>

        {/* Editing an element */}
        <AccordionItem>
          <h2>
            <AccordionButton>
              <Box flex="1" textAlign="left" fontWeight="bold" fontSize="2xl">
                Edit existing element
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <FeatureSection
              title="Options for editing an element"
              data={editingElementData}
            />
          </AccordionPanel>
        </AccordionItem>

        {/* Screen and Playback controls */}
        <AccordionItem>
          <h2>
            <AccordionButton>
              <Box flex="1" textAlign="left" fontWeight="bold" fontSize="2xl">
                Screen and playback controls
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <FeatureSection
              data={screenAndPlaybackData}
            />
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </>

  )
}

export default PresentationManual