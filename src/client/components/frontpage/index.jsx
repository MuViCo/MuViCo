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
    "linear(to-r, pink.200, rgb(148, 0, 202))",
    "linear(to-r, pink, rgb(157, 0, 214))"
  )

  return (
    <Container maxW="3xl">
      <Stack
        as={Box}
        textAlign="center"
        spacing={{ base: 10, md: 14 }}
        py={{ base: 20, md: 32 }}
      >
        {/* Title */}
      <Heading
        fontSize={{ base: "60px", md: "160px" }}
        fontWeight="extrabold"
        lineHeight="1"
        bgGradient={bgGradient}
        bgClip="text"
      >
        MuViCo
      </Heading>

        {/* Subtitle */}
        <Text 
        mt={-10}
        fontFamily="'Zalando Sans Expanded', sans-serif"
        color="gray.50"
        letterSpacing="0.01em"
        fontSize={{ base: "20x", md: "20px"}}>
          Music Visualization in Concerts
        </Text>

        {/* Logo */}
        <SimpleGrid justifyContent="center"
          mt={20}
          mb={20}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          >
            <RadialCircle />
          </motion.div>
        </SimpleGrid>

        <Text
          fontFamily="'Zalando Sans Expanded', sans-serif"
          fontWeight={500}
          fontSize={{ base: "lg", md: "2xl" }}
          fontStyle="normal"
          letterSpacing="0.01em"
          color="whiteAlpha.700"
        >
          {/* Ylempi rivi */}
          Designed to provide{" "}
          <Text as="span" fontFamily="'Boldonse', system-ui" fontStyle="italic" fontWeight="bold" color="gray.50">
            visual elements
          </Text>{" "}
          and
          <br />
          {/* Alempi rivi */}
          <Text as="span" fontFamily="'Boldonse', system-ui" fontStyle="italic" fontWeight="bold" color="gray.50">
            support functions
          </Text>{" "}
          for live music performances
        </Text>

        {/* Feature cards */}
        <SimpleGrid
          spacing={6}
          templateColumns="repeat(auto-fill, minmax(200px, 1fr))"
          pt={6}
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

        {/* Video section */}
        <Box
          bg="gray.700"
          borderRadius="lg"
          p={{ base: 5, md: 6 }}
          boxShadow="md"
          mt={10}
        >
          <Heading size="lg" mb={4}>
            What Does MuViCo Do?
          </Heading>

          <Text mb={8} color="whiteAlpha.800">
            Here are some example videos that show what MuViCo does in practice.
          </Text>

          {/* Edit mode video */}
          <Box mb={10}>
            <Heading size="md" mb={3}>
              Creating and Editing a Presentation
            </Heading>
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

          {/* Show mode video */}
          <Box>
            <Heading size="md" mb={3}>
              Show Mode in Action
            </Heading>
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
