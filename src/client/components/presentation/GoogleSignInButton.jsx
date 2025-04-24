import React from "react"
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import {
  Button,
  Box,
  Text,
  Container,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  IconButton,
  useDisclosure,
} from "@chakra-ui/react"
import { QuestionIcon } from "@chakra-ui/icons"
import axios from "axios"

import { auth } from "../utils/firebase"

const GoogleSignInButton = ({ onLogin }) => {
  const { isOpen, onOpen, onClose } = useDisclosure()

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider()
      provider.addScope("profile")
      provider.addScope("email")
      provider.addScope("https://www.googleapis.com/auth/drive.file")

      const result = await signInWithPopup(auth, provider)

      const credential = GoogleAuthProvider.credentialFromResult(result)
      const driveAccessToken = credential.accessToken

      const idToken = await result.user.getIdToken(true)
      const response = await axios.post(
        "/api/login/firebase",
        { driveAccessToken },
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      )

      const user = response.data
      window.localStorage.setItem("user", JSON.stringify(user) ?? "No user")
      onLogin(user)
    } catch (error) {
      console.error("Error signing in with Google:", error)
    }
  }

  return (
    <Container>
      <Box display="flex" alignItems="center">
        <Button
          onClick={handleGoogleSignIn}
          colorScheme="purple"
          variant="outline"
          size="lg"
          mt={4}
          mb={4}
          fontWeight="medium"
          display="flex"
          alignItems="center"
          justifyContent="center"
          gap={2}
          px={4}
          py={2}
        >
          <Box width="20px" height="20px" mr={3} bg="transparent">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              width="20px"
              height="20px"
              fill="currentColor"
            >
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              ></path>
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
              ></path>
              <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
              ></path>
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              ></path>
              <path fill="none" d="M0 0h48v48H0z"></path>
            </svg>
          </Box>
          <Text>Sign in with Google</Text>
        </Button>

        <IconButton
          icon={<QuestionIcon />}
          variant="ghost"
          size="lg"
          ml={1}
          onClick={onOpen}
          colorScheme="purple"
        />
      </Box>

      <Modal isCentered isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalOverlay
          bg="none"
          backdropFilter="auto"
          backdropInvert="0%"
          backdropBlur="10px"
        />
        <ModalContent>
          <ModalHeader>Sign In with Google Information</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={2} fontWeight="bold">
              Our app offers two distinct storage solutions:
            </Text>
            <Text mb={2}>
              <Text as="span" fontWeight="bold">
                Google Drive Storage:
              </Text>{" "}
              Connect your Google Drive account directly to the app to enjoy
              unlimited storage.
            </Text>{" "}
            <Text mb={2}>
              <Text as="span" fontWeight="bold">
                AWS Storage:
              </Text>{" "}
              Use the AWS storage provided by the app which comes with a storage
              limit of 50 MB.
            </Text>{" "}
            <Text mb={2} fontWeight="bold">
              Sign In with Google:
            </Text>
            <Text mb={2}>
              By choosing to log in with your Google account, your Google Drive
              will be automatically linked to the app—providing you with
              unlimited storage.
            </Text>
            <Text mb={2}>
              If you decide later that you prefer the AWS storage option (up to
              50 MB), you can easily change your storage method in the account
              settings on the homepage.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  )
}

export default GoogleSignInButton
