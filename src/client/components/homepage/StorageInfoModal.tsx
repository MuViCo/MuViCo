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
  UnorderedList,
  ListItem,
} from "@chakra-ui/react"

const StorageInfoModal = ({ isOpen, onClose, user }) => (
  <Modal isCentered isOpen={isOpen} onClose={onClose} size="2xl">
    <ModalOverlay
      bg="none"
      backdropFilter="auto"
      backdropInvert="0%"
      backdropBlur="10px"
    />
    <ModalContent>
      <ModalHeader>Storage Options</ModalHeader>
      <ModalCloseButton />
      <ModalBody>
        {user.driveToken ? (
          <Text fontStyle="italic" color="purple.400">
            You are currently using <strong>Google Drive</strong>
          </Text>
        ) : (
          <Text fontStyle="italic" color="purple.400">
            You are currently using <strong>AWS</strong>
          </Text>
        )}
        <Text mt={4} mb={2}>
          Our app offers two distinct storage solutions. Please review the
          options below and choose the one that best fits your needs.
        </Text>

        <Text fontWeight="bold" mt={2}>
          Google Drive Integration
        </Text>
        <UnorderedList ml={4} mb={2}>
          <ListItem>
            <Text as="span" fontWeight="bold">
              Link Your Account:
            </Text>{" "}
            Connect your Google Drive account directly to the app.
          </ListItem>
          <ListItem>
            <Text as="span" fontWeight="bold">
              No Storage Limits:
            </Text>{" "}
            Enjoy unlimited storage capacity, so you can store as many files as
            you need without any space concerns.
          </ListItem>
          <ListItem>
            <Text as="span" fontWeight="bold">
              Seamless Experience:
            </Text>{" "}
            Manage and access your files easily through the familiar Google
            Drive interface.
          </ListItem>
        </UnorderedList>

        <Text fontWeight="bold" mt={2}>
          AWS Storage Provided by the App
        </Text>
        <UnorderedList ml={4} mb={2}>
          <ListItem>
            <Text as="span" fontWeight="bold">
              App-Managed Storage:
            </Text>{" "}
            The app provides dedicated AWS storage, meaning you don’t have to
            link or manage your own AWS account.
          </ListItem>
          <ListItem>
            <Text as="span" fontWeight="bold">
              Storage Cap:
            </Text>{" "}
            This provided storage option comes with a limit of 50 MB, suitable
            for minimal file storage or short-term data.
          </ListItem>
          <ListItem>
            <Text as="span" fontWeight="bold">
              Optimized for Efficiency:
            </Text>{" "}
            Benefit from the robust and secure AWS infrastructure managed by the
            app within the given limit.
          </ListItem>
        </UnorderedList>

        <Text mt={2} mb={2}>
          <Text as="span" fontWeight="bold">
            Note:
          </Text>{" "}
          Choose Google Drive if you require extensive storage capacity. Select
          AWS storage if your storage needs are minimal or for temporary data
          handling.
        </Text>

        <Text fontSize="s" color="gray.400">
          <Text as="span" fontWeight="bold">
            Important:
          </Text>{" "}
          There will be separate presentations for AWS and Google Drive. When
          you link Google Drive, you will only see the presentations you created
          while using Google Drive. When you link AWS, you will only see the
          presentations you added when using AWS.
        </Text>
      </ModalBody>
      <ModalFooter>
        <Button onClick={onClose}>Close</Button>
      </ModalFooter>
    </ModalContent>
  </Modal>
)

export default StorageInfoModal
