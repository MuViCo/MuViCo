/**
 * MultiScreenModal.jsx
 * Lets the user pick which screens an image cue spans across.
 * - The cue's own screen is always included and can't be unchecked (it's
 *   where the cue lives in the editor grid).
 * - Screens are shown in order 1..screenCount; that's also the left-to-right
 *   slice order used when rendering (see screenSpanLayout.ts).
 * - Saving with fewer than 2 screens checked clears the span entirely.
 * - Fill and position decide how the media is scaled into the combined
 *   canvas and what the crop keeps; they only matter once it spans.
 */

import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import {
  Button,
  Checkbox,
  CheckboxGroup,
  Divider,
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

import { occupiedScreens } from "../utils/cueScreenSpanUtils"
import {
  DEFAULT_SPAN_FILL,
  DEFAULT_SPAN_POSITION,
} from "../utils/screenSpanLayout"
import SpanFramingPicker from "./SpanFramingPicker"
import type { Cue, CueUpdateInput, SpanFill, SpanPosition } from "../../types"

interface MultiScreenModalProps {
  isOpen: boolean
  onClose: () => void
  cue: Cue | null
  screenCount: number
  cues?: Cue[]
  hasLaneForLayer?: (screenNumber: number, layer: number) => boolean
  onSave?: (updatedCue: CueUpdateInput) => Promise<void> | void
}

const MultiScreenModal = ({
  isOpen,
  onClose,
  cue,
  screenCount,
  cues,
  hasLaneForLayer,
  onSave,
}: MultiScreenModalProps) => {
  const [selectedScreens, setSelectedScreens] = useState<number[]>([])
  const [fill, setFill] = useState<SpanFill>(DEFAULT_SPAN_FILL)
  const [position, setPosition] = useState<SpanPosition>(DEFAULT_SPAN_POSITION)

  useEffect(() => {
    if (isOpen && cue) {
      const initial =
        (cue.spanScreens?.length ?? 0) > 1
          ? (cue.spanScreens as number[])
          : [cue.screen]
      setSelectedScreens(initial)
      setFill(cue.spanFill ?? DEFAULT_SPAN_FILL)
      setPosition(cue.spanPosition ?? DEFAULT_SPAN_POSITION)
    }
  }, [isOpen, cue])

  if (!isOpen || !cue) {
    return null
  }

  const layer = Number(cue.layer ?? 0)
  const layerLabel = `L${layer + 1}`
  const isSpanning = selectedScreens.length > 1

  const conflictOnScreen = (screenNumber: number) =>
    (cues || []).find(
      (other) =>
        other._id !== cue._id &&
        other.cueType === "visual" &&
        Number(other.index) === Number(cue.index) &&
        Number(other.layer ?? 0) === layer &&
        occupiedScreens(other).includes(screenNumber)
    )

  const handleChange = (values: (string | number)[]) => {
    const asNumbers = values.map(Number)
    // The cue's own screen is where it lives in the grid; it can't be
    // unchecked out of its own span.
    if (!asNumbers.includes(cue.screen)) {
      asNumbers.push(cue.screen)
    }
    setSelectedScreens(asNumbers)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!onSave) {
      return
    }

    const spanScreens = selectedScreens.length > 1 ? selectedScreens : []
    // cueName (not just name) is what the update pipeline actually reads
    // (see ToolBox.jsx's onSave payload for the same convention).
    await onSave({
      ...cue,
      cueName: cue.name,
      spanScreens,
      spanFill: fill,
      spanPosition: position,
    })
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
              It keeps layer {layerLabel} on every one of them. Screen{" "}
              {cue.screen} stays included since it&apos;s where this element
              lives.
            </Text>
            <CheckboxGroup value={selectedScreens} onChange={handleChange}>
              <Stack spacing={2}>
                {screenNumbers.map((screenNumber) => {
                  const isOwnScreen = screenNumber === cue.screen
                  const conflict = isOwnScreen
                    ? undefined
                    : conflictOnScreen(screenNumber)
                  const addsLane =
                    !isOwnScreen &&
                    !conflict &&
                    hasLaneForLayer &&
                    !hasLaneForLayer(screenNumber, layer)

                  let note = layerLabel
                  if (conflict) {
                    note = `${layerLabel} · taken by "${conflict.name}"`
                  } else if (addsLane) {
                    note = `${layerLabel} · adds a lane`
                  }

                  return (
                    <Checkbox
                      key={screenNumber}
                      value={screenNumber}
                      isDisabled={isOwnScreen || Boolean(conflict)}
                    >
                      <Text as="span">
                        Screen {screenNumber}
                        {isOwnScreen ? " (this element)" : ""}
                      </Text>
                      <Text as="span" ml={2} fontSize="xs" color="gray.500">
                        {note}
                      </Text>
                    </Checkbox>
                  )
                })}
              </Stack>
            </CheckboxGroup>

            <Divider my={4} />

            <Text mb={2} fontSize="sm" fontWeight="medium">
              Framing
            </Text>
            <Text mb={3} fontSize="xs" color="gray.500">
              {isSpanning
                ? "How the media is scaled across the screens, and which part survives the crop."
                : "Applies once this element spans more than one screen."}
            </Text>

            <SpanFramingPicker
              fill={fill}
              position={position}
              onFillChange={setFill}
              onPositionChange={setPosition}
              isDisabled={!isSpanning}
            />
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
