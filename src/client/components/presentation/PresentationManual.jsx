import { Text } from "@chakra-ui/react"
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
      </Text>
      <Text fontWeight="bold" fontSize="2xl" mb={1}>
        Presentation editor page
      </Text>
      <Text mb={3}>
        Here you will see all the elements in the current presentation.
      </Text>
      <FeatureSection
        title="Features on this page"
        data={editModeFeaturesData}
      ></FeatureSection>

      <Text fontWeight="bold" mb={1} mt={10} fontSize="2xl">
        Adding an element
      </Text>
      <FeatureSection
        title="Steps to add an element"
        data={stepsToAddElementData}
        listAs="ol"
        listStyleType="inside"
      ></FeatureSection>

      <FeatureSection
        title="Editing an existing element"
        data={editingElementData}
      ></FeatureSection>

      <Text fontWeight="bold" mb={3} mt={10} fontSize="2xl">
        Show mode page
      </Text>
      <Text mb={2}>
        When you click on the Show mode button on the edit presentation page, you
        will be directed to the show mode page, which allows you to preview and
        control your presentation in real-time. Here, you can navigate through
        different screens and slides (frames).
      </Text>
      <FeatureSection
        title="Features on this page:"
        data={showModeFeaturesData}
      ></FeatureSection>
    </>
  )
}
export default PresentationManual
