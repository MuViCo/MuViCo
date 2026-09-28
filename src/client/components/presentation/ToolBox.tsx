/**
 * Toolbox component for editing cue properties in presentation mode
 * - Displays a modal with a form for editing cue properties such as name
 * - Uses Chakra UI components for styling and layout
 * - Validates input and calls onSave callback with updated cue data when the form is submitted
 * - Resets form state when the modal is opened or closed
 */

import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import {
  Button,
  Box,
  Checkbox,
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
  Select,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Text,
  Textarea,
} from "@chakra-ui/react"
import {
  DEFAULT_TEXT_COLOR,
  DEFAULT_TEXT_EFFECT,
  DEFAULT_TEXT_EFFECT_SPEED,
  DEFAULT_TEXT_SIZE,
  MAX_TEXT_EFFECT_SPEED,
  MAX_TEXT_LENGTH,
  MIN_TEXT_EFFECT_SPEED,
  TEXT_EFFECTS,
  TEXT_SIZE_SLIDER_MAX,
  TEXT_SIZE_SLIDER_MIN,
  isTextCue,
  normalizeTextColor,
  normalizeTextEffect,
  normalizeTextEffectSpeed,
  normalizeTextSize,
  textSnippet,
} from "../utils/cueText"
import {
  opacityFromPercent,
  opacityPercentFromCue,
} from "../utils/cueOpacityUtils"
import { FULL_FRAME, isFullFrame, normalizeCueFrame } from "../utils/cueFrame"
import type { CueFrame } from "../utils/cueFrame"
import { parseAspectRatio } from "../../../constants.js"
import CueFramePicker from "./CueFramePicker"
import type { Cue, CueUpdateInput } from "../../types"

interface ToolboxProps {
  isOpen: boolean
  onClose: () => void
  cue: Cue | null
  onSave?: (updatedCue: CueUpdateInput) => Promise<void> | void
  outputAspectRatio?: string
}

const Toolbox = ({
  isOpen,
  onClose,
  cue,
  onSave,
  outputAspectRatio,
}: ToolboxProps) => {
  const [cueName, setCueName] = useState("")
  const [opacityPercent, setOpacityPercent] = useState(100)
  const [frame, setFrame] = useState<CueFrame>(FULL_FRAME)
  const [textValue, setTextValue] = useState("")
  const [textSize, setTextSize] = useState(DEFAULT_TEXT_SIZE)
  const [textColor, setTextColor] = useState(DEFAULT_TEXT_COLOR)
  const [textEffect, setTextEffect] = useState(DEFAULT_TEXT_EFFECT)
  const [textEffectSpeed, setTextEffectSpeed] = useState(
    DEFAULT_TEXT_EFFECT_SPEED
  )
  const [textEffectLoop, setTextEffectLoop] = useState(false)
  const isText = isTextCue(cue)

  useEffect(() => {
    if (isOpen) {
      setCueName(cue?.name || (isTextCue(cue) ? textSnippet(cue?.text) : ""))
      setOpacityPercent(opacityPercentFromCue(cue))
      setFrame(normalizeCueFrame(cue?.frame))
      setTextValue(cue?.text || "")
      setTextSize(normalizeTextSize(cue?.textSize))
      setTextColor(normalizeTextColor(cue?.textColor))
      setTextEffect(normalizeTextEffect(cue?.textEffect))
      setTextEffectSpeed(normalizeTextEffectSpeed(cue?.textEffectSpeed))
      setTextEffectLoop(Boolean(cue?.textEffectLoop))
    }
  }, [cue, isOpen])

  const trimmedText = textValue.trim()

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    const trimmedName = cueName.trim()
    if (!trimmedName || !cue || !onSave) {
      return
    }

    if (isText && !trimmedText) {
      return
    }

    const finalName =
      isText && trimmedName === textSnippet(cue.text)
        ? textSnippet(trimmedText)
        : trimmedName

    await onSave({
      ...cue,
      cueName: finalName,
      opacity: opacityFromPercent(opacityPercent),
      ...(isText && {
        text: trimmedText,
        textColor,
        textSize,
        textEffect,
        textEffectSpeed,
        textEffectLoop,
      }),
      frame: isFullFrame(frame) ? null : frame,
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
        <ModalHeader>
          {isText ? "Edit text element" : "Edit cue name"}
        </ModalHeader>
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
            {isText && (
              <>
                <FormControl mt={5} isRequired>
                  <FormLabel>Text</FormLabel>
                  <Textarea
                    data-testid="toolbox-text"
                    value={textValue}
                    onChange={(event) => setTextValue(event.target.value)}
                    rows={3}
                    maxLength={MAX_TEXT_LENGTH}
                  />
                </FormControl>
                <FormControl mt={5}>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    mb={2}
                  >
                    <FormLabel mb={0}>Text size</FormLabel>
                    <Text fontSize="sm" fontWeight="bold">
                      {textSize}%
                    </Text>
                  </Box>
                  <Slider
                    aria-label="Text size"
                    min={TEXT_SIZE_SLIDER_MIN}
                    max={TEXT_SIZE_SLIDER_MAX}
                    step={1}
                    value={Math.min(
                      TEXT_SIZE_SLIDER_MAX,
                      Math.max(TEXT_SIZE_SLIDER_MIN, textSize)
                    )}
                    onChange={setTextSize}
                  >
                    <SliderTrack>
                      <SliderFilledTrack />
                    </SliderTrack>
                    <SliderThumb />
                  </Slider>
                  <Text fontSize="xs" mt={1}>
                    Percentage of the screen height.
                  </Text>
                </FormControl>
                <FormControl mt={5}>
                  <FormLabel>Text color</FormLabel>
                  <Input
                    data-testid="toolbox-text-color"
                    type="color"
                    value={textColor}
                    onChange={(event) => setTextColor(event.target.value)}
                    p={1}
                    w="80px"
                  />
                </FormControl>
                <FormControl mt={5}>
                  <FormLabel>Animation</FormLabel>
                  <Select
                    data-testid="toolbox-text-effect"
                    aria-label="Animation"
                    value={textEffect}
                    onChange={(event) => setTextEffect(event.target.value)}
                  >
                    {TEXT_EFFECTS.map((effect) => (
                      <option key={effect.value} value={effect.value}>
                        {effect.label}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                {textEffect !== "none" && (
                  <FormControl mt={5}>
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      mb={2}
                    >
                      <FormLabel mb={0}>Animation speed</FormLabel>
                      <Text fontSize="sm" fontWeight="bold">
                        {textEffectSpeed}×
                      </Text>
                    </Box>
                    <Slider
                      aria-label="Animation speed"
                      data-testid="toolbox-text-effect-speed"
                      min={MIN_TEXT_EFFECT_SPEED}
                      max={MAX_TEXT_EFFECT_SPEED}
                      step={0.25}
                      value={textEffectSpeed}
                      onChange={setTextEffectSpeed}
                    >
                      <SliderTrack>
                        <SliderFilledTrack />
                      </SliderTrack>
                      <SliderThumb />
                    </Slider>
                  </FormControl>
                )}
                {textEffect !== "none" && (
                  <FormControl mt={3}>
                    <Checkbox
                      data-testid="toolbox-text-effect-loop"
                      isChecked={textEffectLoop}
                      onChange={(event) =>
                        setTextEffectLoop(event.target.checked)
                      }
                    >
                      Repeat the animation
                    </Checkbox>
                  </FormControl>
                )}
              </>
            )}
            {cue.cueType !== "audio" && (
              <FormControl mt={5}>
                <FormLabel mb={2}>Position on screen</FormLabel>
                <CueFramePicker
                  value={frame}
                  aspectRatio={parseAspectRatio(outputAspectRatio)}
                  onChange={setFrame}
                />
              </FormControl>
            )}
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
            <Button
              colorScheme="orange"
              type="submit"
              ml={3}
              isDisabled={isText && !trimmedText}
            >
              Save
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}

export default Toolbox
