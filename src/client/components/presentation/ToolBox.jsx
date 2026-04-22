/**
 * Toolbox component for editing cue properties in presentation mode
 * - Displays a modal with a form for editing cue properties such as name
 * - Uses Chakra UI components for styling and layout
 * - Validates input and calls onSave callback with updated cue data when the form is submitted
 * - Resets form state when the modal is opened or closed
 */

import { useEffect, useState } from "react"
import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/react"

const Toolbox = ({
  isOpen,
  onClose,
  cue,
  onSave,
}) => {
  const [cueName, setCueName] = useState("")

  useEffect(() => {
    if (isOpen) {
      setCueName(cue?.cueName || cue?.name || "")
    }
  }, [cue, isOpen])

  const handleSubmit = async (event) => {
    event.preventDefault()

    const trimmedName = cueName.trim()
    if (!trimmedName || !cue || !onSave) {
      return
    }

    await onSave({
      ...cue,
      cueName: trimmedName,
      name: trimmedName,
    })
    onClose()
  }

  if (!isOpen || !cue) {
    return null
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Edit cue name</ModalHeader>
        <ModalCloseButton />
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <FormControl isRequired>
              <FormLabel>Element name</FormLabel>
              <Input
                value={cueName}
                onChange={(event) => setCueName(event.target.value)}
                placeholder="Cue name"
                maxLength={100}
                autoFocus
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="orange" type="submit" ml={3}>
              Save
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}

export default Toolbox
