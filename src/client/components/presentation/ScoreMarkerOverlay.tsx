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
        .map((marker) => {
          const isHighlighted = marker._id === highlightedMarkerId
          return (
            <Box
              key={marker._id}
              position="absolute"
              left={`${marker.rect!.x * 100}%`}
              top={`${marker.rect!.y * 100}%`}
              transform="translate(-50%, -50%)"
              pointerEvents="auto"
              cursor="pointer"
              zIndex={isHighlighted ? 3 : 1}
              title={`Frame ${marker.frameIndex} — click to edit`}
              data-marker-id={marker._id}
              onClick={(event) => {
                event.stopPropagation()
                onSelectMarker(marker)
              }}
            >
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                width="22px"
                height="22px"
                borderRadius="full"
                bg="purple.500"
                border="2px solid white"
                boxShadow="0 1px 4px rgba(0,0,0,0.4)"
                _hover={{ bg: "red.500" }}
                sx={
                  isHighlighted
                    ? { animation: `${markerPing} 1s ease-out 3` }
                    : undefined
                }
              >
                <Text fontSize="10px" fontWeight={700} color="white">
                  {marker.frameIndex}
                </Text>
              </Box>
            </Box>
          )
        })}
    </Box>
  )
}

export default ScoreMarkerOverlay
