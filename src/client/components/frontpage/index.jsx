import {
  Container,
  Box,
  Heading,
  SimpleGrid,
  Stack,
  Text,
  Image,
} from "@chakra-ui/react"

import { motion } from "framer-motion"
import InfoCard from "./Card"
import RadialCircle from "./RadialCircle"

const FrontPage = () => (
  <Container maxW={"3xl"}>
    <Stack
      as={Box}
      textAlign={"center"}
      spacing={{ base: 8, md: 14 }}
      py={{ base: 20, md: 36 }}
    >
      <Heading size="4xl">MuViCo</Heading>{" "}
      <SimpleGrid justifyContent={"center"}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity }}
        >
          <RadialCircle />
        </motion.div>
      </SimpleGrid>
      <Text color={"white.500"}>Music Visualisazation for Concerts</Text>
      <SimpleGrid
        spacing={4}
        templateColumns="repeat(auto-fill, minmax(200px, 1fr))"
      >
        <InfoCard
          title="Ease of use"
          description="Create a presentation in just a few clicks"
        />
        <InfoCard
          title="Show mode"
          description="Create a presentation in just a few clicks"
        />
        <InfoCard
          title="Remote access"
          description="Create a presentation in just a few clicks"
        />
      </SimpleGrid>
    </Stack>
  </Container>
)

export default FrontPage
