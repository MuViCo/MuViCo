import { Text } from "@chakra-ui/react"
import { frontpageFeaturesData } from "../data/frontpageData"
import FeatureSection from "../utils/FeatureSection"

const FrontpageManual = () => {
  return (
    <>
      <Text mb={4}>
        Welcome to the user manual. This modal provides guidance on how to use
        the application.
      </Text>
      <Text fontWeight="bold" mb={1} fontSize="2xl">
        Frontpage
      </Text>
      <FeatureSection
        title="Features on this page"
        data={frontpageFeaturesData}
      ></FeatureSection>
    </>
  )
}
export default FrontpageManual