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
  Box,
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
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Text,
} from "@chakra-ui/react"
import {
  opacityFromPercent,
  opacityPercentFromCue,
} from "../utils/cueOpacityUtils"

const Toolbox = ({
  isOpen,
  onClose,
  cue,
  onSave,
}) => {
  const [cueName, setCueName] = useState("")
  const [opacityPercent, setOpacityPercent] = useState(100)

  useEffect(() => {
    if (isOpen) {
      setCueName(cue?.cueName || cue?.name || "")
      setOpacityPercent(opacityPercentFromCue(cue))
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
      opacity: opacityFromPercent(opacityPercent),
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
            {cue.cueType !== "audio" && (
              <FormControl mt={5}>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  mb={2}
                >
                  <FormLabel mb={0}>Layer opacity</FormLabel>
                  <Text fontSize="sm" fontWeight="bold">
                    {opacityPercent}%
                  </Text>
                </Box>
                <Slider
                  aria-label="Layer opacity"
                  min={0}
                  max={100}
                  step={5}
                  value={opacityPercent}
                  onChange={setOpacityPercent}
                >
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb />
                </Slider>
              </FormControl>
            )}
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
