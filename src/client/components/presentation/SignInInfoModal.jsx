import React from "react"
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  Text,
} from "@chakra-ui/react"

const SignInInfoModal = ({ isOpen, onClose }) => (
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
          By choosing to log in with your Google account, your Google Drive will
          be automatically linked to the app—providing you with unlimited
          storage.
        </Text>
        <Text mb={2}>
          If you decide later that you prefer the AWS storage option (up to 50
          MB), you can easily change your storage method in the account settings
          on the homepage.
        </Text>
      </ModalBody>
      <ModalFooter>
        <Button onClick={onClose}>Close</Button>
      </ModalFooter>
    </ModalContent>
  </Modal>
)

export default SignInInfoModal
