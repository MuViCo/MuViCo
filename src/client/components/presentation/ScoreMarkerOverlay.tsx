// Overlay on the rendered PDF page: click to place a marker, click an
// existing pin to edit it, or drag a pin to reposition it. Positions are
// fractions (0-1) so zoom doesn't matter.

import { Box, Text } from "@chakra-ui/react"
import { keyframes } from "@emotion/react"
import { useEffect, useRef, useState } from "react"

import type { MouseEvent as ReactMouseEvent } from "react"
import type { ScoreMarker } from "../../types"

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v))

// Ring that pings outward from a pin to show which marker was jumped to.
const markerPing = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(128, 90, 213, 0.7); }
  70% { box-shadow: 0 0 0 14px rgba(128, 90, 213, 0); }
  100% { box-shadow: 0 0 0 0 rgba(128, 90, 213, 0); }
`

export interface ScoreMarkerOverlayProps {
  markers: ScoreMarker[]
  isPlacing: boolean
  onPlace?: (x: number, y: number) => void
  onSelectMarker?: (marker: ScoreMarker) => void
  onMoveMarker?: (marker: ScoreMarker, x: number, y: number) => void
  conflictedMarkerIds?: Set<string>
  highlightedMarkerId?: string | null
}

interface ScoreMarkerPinProps {
  marker: ScoreMarker
  isHighlighted?: boolean
  isActive?: boolean
  isDragging?: boolean
  isConflicted?: boolean
  draggable?: boolean
  onSelect?: (marker: ScoreMarker) => void
  onDragStart?: (marker: ScoreMarker, event: ReactMouseEvent) => void
}

export const ScoreMarkerPin = ({
  marker,
  isHighlighted = false,
  isActive = false,
  isDragging = false,
  isConflicted = false,
  draggable = false,
  onSelect,
  onDragStart,
}: ScoreMarkerPinProps) => (
  <Box
    position="absolute"
    left={`${marker.rect!.x * 100}%`}
    top={`${marker.rect!.y * 100}%`}
    transform="translate(-50%, -50%)"
    pointerEvents={onSelect || draggable ? "auto" : "none"}
    cursor={
      draggable
        ? isDragging
          ? "grabbing"
          : "grab"
        : onSelect
          ? "pointer"
          : "default"
    }
    zIndex={isHighlighted || isActive || isDragging ? 3 : 1}
    title={`Frame ${marker.frameIndex}${isConflicted ? " — conflict: another marker uses this frame" : ""}${onSelect ? " — click to edit, drag to move" : ""}`}
    data-marker-id={marker._id}
    data-testid="score-marker-pin"
    data-active={isActive}
    onMouseDown={
      draggable
        ? (event) => {
            event.preventDefault()
            event.stopPropagation()
            onDragStart?.(marker, event)
          }
        : undefined
    }
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
      bg={isActive ? "red.500" : isConflicted ? "orange.400" : "purple.500"}
      border="2px solid white"
      boxShadow="0 1px 4px rgba(0,0,0,0.4)"
      opacity={isDragging ? 0.8 : 1}
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
  onMoveMarker,
  conflictedMarkerIds,
  highlightedMarkerId = null,
}: ScoreMarkerOverlayProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const movedRef = useRef(false)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null)

  const fractionFromClient = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0 || rect.height === 0) return null
    return {
      x: clamp((clientX - rect.left) / rect.width, 0, 1),
      y: clamp((clientY - rect.top) / rect.height, 0, 1),
    }
  }

  useEffect(() => {
    if (!draggingId) return

    const handleMove = (event: globalThis.MouseEvent) => {
      const pos = fractionFromClient(event.clientX, event.clientY)
      if (!pos) return
      movedRef.current = true
      setDragPos(pos)
    }

    const handleUp = (event: globalThis.MouseEvent) => {
      const marker = markers.find((m) => m._id === draggingId)
      const pos = fractionFromClient(event.clientX, event.clientY)
      if (marker && pos && movedRef.current) {
        onMoveMarker?.(marker, pos.x, pos.y)
      }
      setDraggingId(null)
      setDragPos(null)
    }

    window.addEventListener("mousemove", handleMove)
    window.addEventListener("mouseup", handleUp)
    return () => {
      window.removeEventListener("mousemove", handleMove)
      window.removeEventListener("mouseup", handleUp)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draggingId])

  const handleClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!isPlacing || !onPlace) return
    const pos = fractionFromClient(event.clientX, event.clientY)
    if (!pos) return
    onPlace(pos.x, pos.y)
  }

  const handleDragStart = (marker: ScoreMarker, event: ReactMouseEvent) => {
    movedRef.current = false
    setDraggingId(marker._id)
    setDragPos({ x: marker.rect!.x, y: marker.rect!.y })
    void event
  }

  const handleSelect = (marker: ScoreMarker) => {
    // A click event follows a mouseup even after a drag — swallow that one.
    if (movedRef.current) {
      movedRef.current = false
      return
    }
    onSelectMarker?.(marker)
  }

  return (
    <Box
      ref={containerRef}
      position="absolute"
      inset={0}
      onClick={handleClick}
      cursor={isPlacing ? "crosshair" : "default"}
      pointerEvents={isPlacing ? "auto" : "none"}
      userSelect={draggingId ? "none" : undefined}
      data-testid="score-marker-overlay"
    >
      {markers
        .filter((marker) => marker.rect)
        .map((marker) => {
          const isDragging = marker._id === draggingId
          const displayMarker =
            isDragging && dragPos
              ? { ...marker, rect: { ...marker.rect!, ...dragPos } }
              : marker
          return (
            <ScoreMarkerPin
              key={marker._id}
              marker={displayMarker}
              isHighlighted={marker._id === highlightedMarkerId}
              isDragging={isDragging}
              isConflicted={conflictedMarkerIds?.has(marker._id) ?? false}
              draggable={Boolean(onMoveMarker)}
              onSelect={onSelectMarker ? handleSelect : undefined}
              onDragStart={handleDragStart}
            />
          )
        })}
    </Box>
  )
}

export default ScoreMarkerOverlay
