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
} from "@chakra-ui/react"
import HomepageManual from "../homepage/HomepageManual"
import PresentationManual from "../presentation/PresentationManual"

const UserManualModal = ({
  isOpen,
  onClose,
  isHomepage,
  isPresentationPage,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="5xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader fontSize="3xl">Help page</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {isHomepage && <HomepageManual></HomepageManual>}
          {isPresentationPage && <PresentationManual></PresentationManual>}
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="purple" onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default UserManualModal
