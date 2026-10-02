/**
 * How a cue that runs across several screens is scaled into their combined
 * canvas, and which part of it survives the crop.
 *
 * Replaces the per-screen frame picker wherever a cue spans: placing it in
 * one screen's ninth says nothing once it covers several.
 */
import { Box, Button, Stack, Text, Tooltip } from "@chakra-ui/react"

import { SPAN_POSITIONS } from "../utils/screenSpanLayout"
import type { SpanFill, SpanPosition } from "../../types"

const POSITION_LABELS: Record<SpanPosition, string> = {
  "top-left": "Top left",
  top: "Top",
  "top-right": "Top right",
  left: "Left",
  center: "Center",
  right: "Right",
  "bottom-left": "Bottom left",
  bottom: "Bottom",
  "bottom-right": "Bottom right",
}

interface SpanFramingPickerProps {
  fill: SpanFill
  position: SpanPosition
  onFillChange: (fill: SpanFill) => void
  onPositionChange: (position: SpanPosition) => void
  isDisabled?: boolean
}

const SpanFramingPicker = ({
  fill,
  position,
  onFillChange,
  onPositionChange,
  isDisabled = false,
}: SpanFramingPickerProps) => (
  <Box>
    <Stack direction="row" spacing={2} mb={3}>
      <Button
        size="sm"
        flex={1}
        aria-pressed={fill === "cover"}
        variant={fill === "cover" ? "solid" : "outline"}
        colorScheme={fill === "cover" ? "purple" : "gray"}
        isDisabled={isDisabled}
        onClick={() => onFillChange("cover")}
      >
        Fill
      </Button>
      <Button
        size="sm"
        flex={1}
        aria-pressed={fill === "contain"}
        variant={fill === "contain" ? "solid" : "outline"}
        colorScheme={fill === "contain" ? "purple" : "gray"}
        isDisabled={isDisabled}
        onClick={() => onFillChange("contain")}
      >
        Fit
      </Button>
    </Stack>

    <Box
      display="grid"
      gridTemplateColumns="repeat(3, 1fr)"
      gap={1}
      maxWidth="150px"
      aria-label="Position"
      role="group"
    >
      {SPAN_POSITIONS.map((candidate) => (
        <Tooltip key={candidate} label={POSITION_LABELS[candidate]}>
          <Button
            size="sm"
            height="38px"
            minWidth={0}
            aria-label={POSITION_LABELS[candidate]}
            aria-pressed={position === candidate}
            variant={position === candidate ? "solid" : "outline"}
            colorScheme={position === candidate ? "purple" : "gray"}
            isDisabled={isDisabled}
            onClick={() => onPositionChange(candidate)}
          />
        </Tooltip>
      ))}
    </Box>

    <Text mt={2} fontSize="xs" color="gray.500">
      {fill === "cover"
        ? "Fill zooms the media until it covers every screen, cropping what overflows."
        : "Fit keeps the whole media visible, leaving bands where it falls short."}
    </Text>
  </Box>
)

export default SpanFramingPicker
