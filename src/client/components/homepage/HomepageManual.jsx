import { Text, Button } from "@chakra-ui/react"
import { homefeaturesData } from "../data/homepageData"
import FeatureSection from "../utils/FeatureSection"

const HomepageManual = () => {
  return (
    <>
      <Text mb={4}>
        Welcome to the user manual. This modal provides guidance on how to use
        the application.
        <br/>
        <br/>
        <Button
          onClick={(e) => {
            e.preventDefault()
            localStorage.removeItem("hasSeenHelp_homepage")
            window.location.reload()
          }}
        >
          Restart the tutorial
        </Button>
      </Text>
      <Text fontWeight="bold" mb={1} fontSize="2xl">
        Home page
      </Text>
      <Text mb={3}>
        After signing in, you will see the home page where you manage your
        presentations.
      </Text>
      <FeatureSection
        title="Features on this page"
        data={homefeaturesData}
      ></FeatureSection>
      <Text fontWeight="bold" mb={1}>
        All created presentations will show here
      </Text>
      <Text mb={3}>
        When you click on the presentation you want to edit, you will be directed
        to the editing page of the presentation.
      </Text>
    </>
  )
}
export default HomepageManual
