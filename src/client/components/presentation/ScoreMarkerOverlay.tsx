// Overlay on the rendered PDF page: click to place a marker, or click an
// existing pin to edit it. Positions are fractions (0-1) so zoom doesn't matter.

import { Box, Text } from "@chakra-ui/react"
import { keyframes } from "@emotion/react"

import type { MouseEvent } from "react"
import type { ScoreMarker } from "../../types"

// Ring that pings outward from a pin to show which marker was jumped to.
const markerPing = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(128, 90, 213, 0.7); }
  70% { box-shadow: 0 0 0 14px rgba(128, 90, 213, 0); }
  100% { box-shadow: 0 0 0 0 rgba(128, 90, 213, 0); }
`

export interface ScoreMarkerOverlayProps {
  markers: ScoreMarker[]
  isPlacing: boolean
  onPlace: (x: number, y: number) => void
  onSelectMarker: (marker: ScoreMarker) => void
  highlightedMarkerId?: string | null
}

interface ScoreMarkerPinProps {
  marker: ScoreMarker
  isHighlighted?: boolean
  isActive?: boolean
  onSelect?: (marker: ScoreMarker) => void
}

export const ScoreMarkerPin = ({
  marker,
  isHighlighted = false,
  isActive = false,
  onSelect,
}: ScoreMarkerPinProps) => (
  <Box
    position="absolute"
    left={`${marker.rect!.x * 100}%`}
    top={`${marker.rect!.y * 100}%`}
    transform="translate(-50%, -50%)"
    pointerEvents={onSelect ? "auto" : "none"}
    cursor={onSelect ? "pointer" : "default"}
    zIndex={isHighlighted || isActive ? 3 : 1}
    title={`Frame ${marker.frameIndex}${onSelect ? " — click to edit" : ""}`}
    data-marker-id={marker._id}
    data-testid="score-marker-pin"
    data-active={isActive}
    onClick={
      onSelect
        ? (event) => {
            event.stopPropagation()
            onSelect(marker)
          }
        : undefined
    }
  >
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      width="22px"
      height="22px"
      borderRadius="full"
      bg={isActive ? "red.500" : "purple.500"}
      border="2px solid white"
      boxShadow="0 1px 4px rgba(0,0,0,0.4)"
      _hover={onSelect ? { bg: "red.500" } : undefined}
      sx={
        isHighlighted ? { animation: `${markerPing} 1s ease-out 3` } : undefined
      }
    >
      <Text fontSize="10px" fontWeight={700} color="white">
        {marker.frameIndex}
      </Text>
    </Box>
  </Box>
)

const ScoreMarkerOverlay = ({
  markers,
  isPlacing,
  onPlace,
  onSelectMarker,
  highlightedMarkerId = null,
}: ScoreMarkerOverlayProps) => {
  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!isPlacing) return
    const rect = event.currentTarget.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    const x = (event.clientX - rect.left) / rect.width
    const y = (event.clientY - rect.top) / rect.height
    onPlace(x, y)
  }

  return (
    <Box
      position="absolute"
      inset={0}
      onClick={handleClick}
      cursor={isPlacing ? "crosshair" : "default"}
      pointerEvents={isPlacing ? "auto" : "none"}
      data-testid="score-marker-overlay"
    >
      {markers
        .filter((marker) => marker.rect)
        .map((marker) => (
          <ScoreMarkerPin
            key={marker._id}
            marker={marker}
            isHighlighted={marker._id === highlightedMarkerId}
            onSelect={onSelectMarker}
          />
        ))}
    </Box>
  )
}

export default ScoreMarkerOverlay
