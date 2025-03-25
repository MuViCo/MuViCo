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
            modalDesc="Add your own images or gifs to the presentation and decide the order of the cues. It's that simple!"
            modalSvg={<Upload />}
          />
          <InfoCard
            title="Multiple screens"
            description="Control multiple screens at once"
            modalTitle="Multiple screens"
            modalDesc="Traverse through multiple screens at once using the unique cue system. Control the visuals on the fly with just one device!"
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
      </Stack>
    </Container>
  )
}

export default FrontPage
