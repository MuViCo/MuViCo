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
  const textColor = useColorModeValue("gray.800", "gray.50")
  const lightTextColor = useColorModeValue("gray.700", "whiteAlpha.700")
  const videoBg = useColorModeValue("white", "gray.700")

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
        color={textColor}
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
          color={lightTextColor}
        >
          {/* Ylempi rivi */}
          Designed to provide{" "}
          <Text as="span" fontFamily="'Boldonse', system-ui" fontStyle="italic" fontWeight="bold" color={textColor}>
            visual elements
          </Text>{" "}
          and
          <br />
          {/* Alempi rivi */}
          <Text as="span" fontFamily="'Boldonse', system-ui" fontStyle="italic" fontWeight="bold" color={textColor}>
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
            title="Upload Media"
            description="Supporting everything from motion and stills to soundscapes."
            modalTitle="Upload Visuals"
            modalDesc="Mix images, videos, GIFs, and audio files effortlessly. It’s as simple as picking your files and setting the flow."
            modalSvg={<Upload />}
          />
          <InfoCard
            title="Build Presentation"
            description="Create a multiscreen presentation in just a few clicks"
            modalTitle="Build Presentation"
            modalDesc="Design stunning multiscreen presentations in seconds. Our smart indexing handles the complexity, letting you command every screen simultaneously from just one device."
            modalSvg={<Desktop />}
          />
          <InfoCard
            title="Show Time"
            description="Your presentations available on the go."
            modalTitle="Show Time"
            modalDesc="MuViCo provides access to your presentations from anywhere. Log in to your account and access your presentations from any device with an internet connection. This makes sharing your presentations between devices easy and convenient."
            modalSvg={<Globe />}
          />
        </SimpleGrid>

        {/* Video section */}
        <Box
          bg={videoBg}
          borderRadius="lg"
          p={{ base: 5, md: 6 }}
          boxShadow="md"
          mt={10}
        >
          <Heading size="lg" mb={4}>
            What Does MuViCo Do?
          </Heading>

          <Text mb={8} color={lightTextColor}>
            Here are some example videos that show what MuViCo does in practice.
          </Text>

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
        </Box>
      </Stack>
    </Container>
  )
}

export default FrontPage
