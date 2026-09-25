import { Box, Button, Text, useColorModeValue } from "@chakra-ui/react"

import {
  CUE_FRAME_GRID,
  FULL_FRAME,
  framesAreEqual,
  normalizeCueFrame,
} from "../utils/cueFrame"
import type { CueFrame } from "../utils/cueFrame"

interface CueFramePickerProps {
  value: CueFrame | null | undefined
  aspectRatio: number
  onChange: (frame: CueFrame) => void
}

const CueFramePicker = ({
  value,
  aspectRatio,
  onChange,
}: CueFramePickerProps) => {
  const current = normalizeCueFrame(value)
  const isFull = framesAreEqual(current, FULL_FRAME)

  const screenBorder = useColorModeValue("purple.300", "whiteAlpha.400")
  const cellBg = useColorModeValue("blackAlpha.50", "whiteAlpha.100")
  const cellHover = useColorModeValue("purple.100", "whiteAlpha.300")
  const markBg = useColorModeValue("purple.500", "purple.300")

  return (
    <Box>
      <Box
        data-testid="cue-frame-picker"
        border="2px solid"
        borderColor={screenBorder}
        borderRadius="6px"
        padding="6px"
        width="100%"
        maxWidth="260px"
        sx={{ aspectRatio: String(aspectRatio) }}
        display="grid"
        gridTemplateColumns="repeat(3, 1fr)"
        gridTemplateRows="repeat(3, 1fr)"
        gap="4px"
      >
        {CUE_FRAME_GRID.map((row) =>
          row.map(({ label, frame }) => {
            const isActive = !isFull && framesAreEqual(current, frame)
            return (
              <Box
                key={label}
                as="button"
                type="button"
                aria-label={label}
                title={label}
                data-testid={`frame-cell-${label}`}
                data-active={isActive ? "true" : undefined}
                onClick={() => onChange(frame)}
                borderRadius="3px"
                bg={isActive ? markBg : cellBg}
                _hover={{ bg: isActive ? markBg : cellHover }}
                transition="background-color 120ms ease"
              />
            )
          })
        )}
      </Box>
      <Button
        mt={2}
        size="xs"
        width="100%"
        maxWidth="260px"
        variant={isFull ? "solid" : "outline"}
        colorScheme="purple"
        data-testid="frame-cell-Full"
        onClick={() => onChange(FULL_FRAME)}
      >
        Full screen
      </Button>
      <Text fontSize="xs" mt={2} opacity={0.7}>
        Click a square to place this element on the screen.
      </Text>
    </Box>
  )
}

export default CueFramePicker
