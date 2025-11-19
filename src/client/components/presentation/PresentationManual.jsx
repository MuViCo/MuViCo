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
  showModeFeaturesData,
} from "../data/presentationPageData"

import FeatureSection from "../utils/FeatureSection"

const PresentationManual = () => {
  return (
    <>
      <Text mb={4}>
        Welcome to the user manual. This modal provides guidance on how to use
        the edit and show mode.
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
        {/* Presentation editor page */}
        <AccordionItem>
          <h2>
            <AccordionButton>
              <Box flex="1" textAlign="left" fontWeight="bold" fontSize="2xl">
                Presentation editor page
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <Text mb={3}>
              Here you will see all the elements in the current presentation.
            </Text>
            <FeatureSection
              title="Features on this page"
              data={editModeFeaturesData}
            />
          </AccordionPanel>
        </AccordionItem>

        {/* Adding an element */}
        <AccordionItem>
          <h2>
            <AccordionButton>
              <Box flex="1" textAlign="left" fontWeight="bold" fontSize="2xl">
                Adding an element
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <FeatureSection
              title="Steps to add an element"
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
                Editing an existing element
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <FeatureSection
              title="Editing an existing element"
              data={editingElementData}
            />
          </AccordionPanel>
        </AccordionItem>

        {/* Show mode page */}
        <AccordionItem>
          <h2>
            <AccordionButton>
              <Box flex="1" textAlign="left" fontWeight="bold" fontSize="2xl">
                Show mode page
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <Text mb={2}>
              When you click on the Show mode button on the edit presentation
              page, you will be directed to the show mode page, which allows you
              to view and control your presentation in real-time.
            </Text>
            <FeatureSection
              title="Features on this page"
              data={showModeFeaturesData}
            />
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </>
  )
}

export default PresentationManual