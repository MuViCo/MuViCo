import { Box, Heading, Text, UnorderedList, ListItem, useColorModeValue } from "@chakra-ui/react"
import React from "react"

const PrivacyPage = () => (
  <Box
    borderRadius="xl"
    marginTop={100}
    mb={6}
    p={4}
    bg={useColorModeValue("whiteAlpha.500", "whiteAlpha.200")}
    css={{ backdropFilter: "blur(10px)" }}
  >
    <Heading as="h1" size="lg" mb={4}>
      Privacy and Cookie Notice
    </Heading>

    <Text mb={3}>
      MuViCo uses only necessary storage and cookies needed for authentication,
      security, and core application features.
    </Text>

    <Heading as="h2" size="md" mb={2}>
      What we store
    </Heading>
    <UnorderedList mb={3} pl={5}>
      <ListItem>Authentication session data to keep you signed in.</ListItem>
      <ListItem>
        Basic preference values (for example tutorial state) to improve usability.
      </ListItem>
    </UnorderedList>

    <Heading as="h2" size="md" mb={2}>
      Third-party services
    </Heading>
    <Text mb={3}>
      When you choose to connect Google services (such as Google Sign-In or
      Google Drive), Google may set or use its own cookies/storage under their
      policies.
    </Text>

    <Heading as="h2" size="md" mb={2}>
      Contact
    </Heading>
    <Text>
      If you have privacy questions or requests, contact
      projectmuvico(at)gmail.com.
    </Text>
  </Box>
)

export default PrivacyPage
