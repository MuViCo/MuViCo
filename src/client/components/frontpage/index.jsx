import {
  Container,
  Box,
  Heading,
  SimpleGrid,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react"

import { motion } from "framer-motion"
import InfoCard from "./Card"
import RadialCircle from "./RadialCircle"
import { Upload, Desktop, Globe } from "./ModalSvgs"
import showModeVideo from "../../public/muvico_showmode.mp4"
import editModeVideo from "../../public/muvico_intro_editmode.mp4"
import showModePreview from "../../public/showmodepreview.png"
import editModePreview from "../../public/editmodepreview.png"

const FrontPage = () => {
  const bgGradient = useColorModeValue(
    "linear(to-r, pink.200,rgb(148, 0, 202))",
    "linear(to-r, pink,rgb(157, 0, 214))"
  )
  return (
    <Container maxW={"3xl"}>
      <Stack
        as={Box}
        textAlign={"center"}
        spacing={{ base: 8, md: 14 }}
        py={{ base: 20, md: 36 }}
      >
        <Heading size="4xl" bgGradient={bgGradient} bgClip="text">
          MuViCo
        </Heading>{" "}
        <SimpleGrid justifyContent={"center"} mb={5}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity }}
          >
            <RadialCircle />
          </motion.div>
        </SimpleGrid>
        <Text color={"white.500"}>Music Visualization in Concerts</Text>
        <SimpleGrid
          spacing={4}
          templateColumns="repeat(auto-fill, minmax(200px, 1fr))"
        >
          <InfoCard
            title="Ease of use"
            description="Create a presentation in just a few clicks"
            modalTitle="Ease of use"
            modalDesc="Add your own images or gifs to the presentation and decide the order of the elements! It's that simple!"
            modalSvg={<Upload />}
          />
          <InfoCard
            title="Multiple screens"
            description="Control multiple screens at once"
            modalTitle="Multiple screens"
            modalDesc="Traverse through multiple screens at once using the unique index system. Control the elements on the fly with just one device!"
            modalSvg={<Desktop />}
          />
          <InfoCard
            title="Remote access"
            description="Your presentations available on the go"
            modalTitle="Remote access"
            modalDesc="MuViCo provides access to your presentations from anywhere. Log in to your account and access your presentations from any device with an internet connection. This makes sharing your presentations between devices easy and convenient."
            modalSvg={<Globe />}
          />
        </SimpleGrid>
        <Box
          bg="gray.700"
          borderRadius="lg"
          p={6}
          boxShadow="md"
        >
          <Heading size="lg" mb={4}>What Does MuViCo Do?</Heading>
          <Text mb={4}>Here are some example videos that show what MuViCo does in practice.</Text>

          <Box mb={8}>
            <Heading size="md" mb={3}>Creating and Editing a Presentation</Heading>
            <Box
              overflow="hidden"
              borderRadius="lg"
              boxShadow="sm"
              _hover={{ boxShadow: "lg", transform: "scale(1.01)" }}
              transition="all 0.25s ease"
            >
              <video
                src={editModeVideo}
                poster={editModePreview}
                controls
                preload="none"
                style={{ width: "100%", display: "block" }}
              />
            </Box>
          </Box>

          <Box mb={4}>
            <Heading size="md" mb={3}>Show Mode in Action</Heading>
            <Box
              overflow="hidden"
              borderRadius="lg"
              boxShadow="sm"
              _hover={{ boxShadow: "lg", transform: "scale(1.01)" }}
              transition="all 0.25s ease"
            >
              <video
                src={showModeVideo}
                poster={showModePreview}
                controls
                preload="none"
                style={{ width: "100%", display: "block" }}
              />
            </Box>
          </Box>
        </Box>
      </Stack>
    </Container>
  )
}

export default FrontPage
