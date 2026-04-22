import {
  Container,
  Box,
  Heading,
  SimpleGrid,
  Stack,
  Text,
  useColorModeValue,
  Flex,
} from "@chakra-ui/react"
import { motion } from "framer-motion"

import InfoCard from "./Card"
import RadialCircle from "./RadialCircle"
import { Upload, Desktop, Globe } from "./ModalSvgs"

import showModeVideo from "../../public/muvico_showmode.mp4"
import editModeVideo from "../../public/muvico_intro_editmode.mp4"
import hyLogo from "../../public/hy_logo.svg"
import bHyLogo from "../../public/b_hy_logo.svg"
import introVideoPreviewLight from "../../public/introvideopreview-light.png"
import introVideoPreviewDark from "../../public/introvideopreview-dark.png"

const FrontPage = () => {
  const bgGradient = useColorModeValue(
    "linear(to-r, pink.200, rgb(148, 0, 202))",
    "linear(to-r, pink, rgb(157, 0, 214))"
  )
  const textColor = useColorModeValue("gray.800", "gray.50")
  const lightTextColor = useColorModeValue("gray.700", "whiteAlpha.700")
  const videoBg = useColorModeValue("white", "gray.700")
  const underlineColor = useColorModeValue("#9D4EDD", "#E9B8FF")
  const hyLogoSrc = useColorModeValue(bHyLogo, hyLogo)
  const IntroVideoPoster = useColorModeValue(introVideoPreviewLight, introVideoPreviewDark)

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
          for live music performances.
          <br />
        </Text>

        {/* Feature cards */}
        <SimpleGrid
          spacing={6}
          columns={{ base: 1, md: 3 }}
          pt={0}
          mb={-5}
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

        {/* Middle section box */}
        <Box
          bg={videoBg}
          borderRadius="lg"
          p={10}
          boxShadow="md"
          mt={1}
          mb={1}
        >
          <Flex align="center" justify="space-between">
            <Box flex="1">
              <Heading fontSize="17px" fontFamily="'Zalando Sans Expanded', sans-serif" mb={3}>
                MuViCo is a project developed by students from the University of Helsinki.
              </Heading>

            </Box>
            <Box ml={6}>
              <img
                src={hyLogoSrc}
                alt="University of Helsinki logo"
                width="80"
                height="80"
                style={{ objectFit: "contain" }}
              />
            </Box>
          </Flex>
        </Box>
        
        {/* Video section */}
        <Box
          bg={videoBg}
          borderRadius="lg"
          p={{ base: 5, md: 6 }}
          boxShadow="md"
          mt={-5}
        >
          <Heading size="lg" mb={2} fontFamily="'Zalando Sans Expanded', sans-serif">
            What Does MuViCo Do?
          </Heading>

          <Text mb={6} color={lightTextColor} fontFamily="'Zalando Sans Expanded', sans-serif">
            Watch MuViCo's live performance and editing workflow in the video below.
          </Text>

          <Box mb={6}>
            <Box
              overflow="hidden"
              borderRadius="lg"
              boxShadow="sm"
              _hover={{ boxShadow: "lg", transform: "scale(1.01)" }}
              transition="all 0.25s ease"
            >
              <video
                src={showModeVideo}
                poster={IntroVideoPoster}
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
