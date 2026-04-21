/**
 * UserManualModal component for the MuViCo application.
 * Displays a modal with user manuals for different pages (frontpage, homepage, presentation page).
 * The content of the manual is determined by the props passed to the component.
 */

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
import FrontpageManual from "../frontpage/FrontpageManual"
import HomepageManual from "../homepage/HomepageManual"
import PresentationManual from "../presentation/PresentationManual"

const UserManualModal = ({
  isOpen,
  onClose,
  isFrontpage,
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
          {isFrontpage && <FrontpageManual></FrontpageManual>}
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
