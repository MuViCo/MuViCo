/**
 * MultiScreenModal.jsx
 * Lets the user pick which screens an image cue spans across.
 * - The cue's own screen is always included and can't be unchecked (it's
 *   where the cue lives in the editor grid).
 * - Screens are shown in order 1..screenCount; that's also the left-to-right
 *   slice order used when rendering (see screenSpanLayout.ts).
 * - Saving with fewer than 2 screens checked clears the span entirely.
 */

import { useEffect, useState } from "react"
import {
  Button,
  Checkbox,
  CheckboxGroup,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
} from "@chakra-ui/react"

const MultiScreenModal = ({ isOpen, onClose, cue, screenCount, onSave }) => {
  const [selectedScreens, setSelectedScreens] = useState([])

  useEffect(() => {
    if (isOpen && cue) {
      const initial =
        cue.spanScreens?.length > 1 ? cue.spanScreens : [cue.screen]
      setSelectedScreens(initial)
    }
  }, [isOpen, cue])

  if (!isOpen || !cue) {
    return null
  }

  const handleChange = (values) => {
    const asNumbers = values.map(Number)
    // The cue's own screen is where it lives in the grid; it can't be
    // unchecked out of its own span.
    if (!asNumbers.includes(cue.screen)) {
      asNumbers.push(cue.screen)
    }
    setSelectedScreens(asNumbers)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!onSave) {
      return
    }

    const spanScreens = selectedScreens.length > 1 ? selectedScreens : []
    // cueName (not just name) is what the update pipeline actually reads
    // (see ToolBox.jsx's onSave payload for the same convention).
    await onSave({ ...cue, cueName: cue.name, spanScreens })
    onClose()
  }

  const screenNumbers = Array.from({ length: screenCount }, (_, i) => i + 1)

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Span across screens</ModalHeader>
        <ModalCloseButton />
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <Text mb={3} fontSize="sm" color="gray.500">
              Pick the screens this image should spread across, left to right.
              Screen {cue.screen} stays included since it's where this element
              lives.
            </Text>
            <CheckboxGroup value={selectedScreens} onChange={handleChange}>
              <Stack spacing={2}>
                {screenNumbers.map((screenNumber) => (
                  <Checkbox
                    key={screenNumber}
                    value={screenNumber}
                    isDisabled={screenNumber === cue.screen}
                  >
                    Screen {screenNumber}
                    {screenNumber === cue.screen ? " (this element)" : ""}
                  </Checkbox>
                ))}
              </Stack>
            </CheckboxGroup>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="purple" type="submit" ml={3}>
              Save
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}

export default MultiScreenModal
