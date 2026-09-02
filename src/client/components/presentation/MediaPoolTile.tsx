/** One draggable tile in the media pool: still, video frame, or audio icon. */

import {
  Box,
  IconButton,
  Image,
  Text,
  useColorModeValue,
} from "@chakra-ui/react"
import { DeleteIcon, WarningTwoIcon } from "@chakra-ui/icons"
import { SpeakerIcon } from "../../lib/icons"
import mediaStore from "./mediaFileStore"

import { useState } from "react"
import { dragDataForMedia, mediaKind } from "../utils/mediaKind"

import type { MediaLibraryItem } from "../../types"

interface MediaPoolTileProps {
  item: MediaLibraryItem
  onDelete: (item: MediaLibraryItem) => void
  suppressDragGhost: (dataTransfer: DataTransfer | null) => void
}

// One height for every kind; previews crop rather than letterbox.
const PREVIEW_HEIGHT = "68px"

const MediaPoolTile = ({
  item,
  onDelete,
  suppressDragGhost,
}: MediaPoolTileProps) => {
  const textColor = useColorModeValue("gray.800", "whiteAlpha.900")
  const mutedText = useColorModeValue("gray.600", "whiteAlpha.500")
  const placeholderBg = useColorModeValue("blackAlpha.50", "whiteAlpha.200")
  const kind = mediaKind(item)
  const [isBroken, setIsBroken] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Box
      draggable={true}
      onDragStart={(event) => {
        suppressDragGhost(event.dataTransfer)
        const dragData = dragDataForMedia(item)
        mediaStore.setActiveDragData(dragData)

        event.dataTransfer.setData("application/json", JSON.stringify(dragData))
        event.dataTransfer.setData("text/plain", JSON.stringify(dragData))
      }}
      onDragEnd={() => mediaStore.clearActiveDragData()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      position="relative"
      border="2px solid"
      borderColor="transparent"
      borderRadius="md"
      p={2}
      cursor="grab"
      transition="border-color 0.15s, background 0.15s"
      _active={{ cursor: "grabbing" }}
      _hover={{ borderColor: "purple.400", bg: "whiteAlpha.100" }}
    >
      {/* Only while this tile is hovered. */}
      {isHovered && (
        <IconButton
          aria-label={`Remove ${item.name}`}
          icon={<DeleteIcon />}
          size="xs"
          colorScheme="red"
          position="absolute"
          top={1}
          right={1}
          onClick={() => onDelete(item)}
          zIndex={1}
        />
      )}

      {kind === "image" && !isBroken && (
        <Image
          src={item.url}
          alt={item.name}
          h={PREVIEW_HEIGHT}
          objectFit="cover"
          w="100%"
          borderRadius="md"
          // An entry can outlive its stored object; show that, not a blank tile.
          onError={() => setIsBroken(true)}
        />
      )}

      {isBroken && (
        <Box
          h={PREVIEW_HEIGHT}
          bg={placeholderBg}
          borderRadius="md"
          display="flex"
          alignItems="center"
          justifyContent="center"
          title="This file is no longer in storage"
        >
          <WarningTwoIcon boxSize="20px" color={mutedText} />
        </Box>
      )}

      {kind === "video" && !isBroken && (
        <Box position="relative" borderRadius="md" overflow="hidden">
          {/* Past 0s, where some encodes are black. Metadata only: a range
              request, not the whole file. */}
          <Box
            as="video"
            data-testid={`video-preview-${item.id}`}
            src={item.url ? `${item.url}#t=0.1` : undefined}
            muted
            playsInline
            preload="metadata"
            h={PREVIEW_HEIGHT}
            w="100%"
            objectFit="cover"
            onError={() => setIsBroken(true)}
            // The tile owns the drag; the video would swallow the press.
            sx={{ pointerEvents: "none", backgroundColor: "black" }}
          />
          <Box
            position="absolute"
            bottom={1}
            left={1}
            px={1.5}
            borderRadius="sm"
            bg="blackAlpha.700"
            color="white"
            fontSize="xs"
            lineHeight="1.4"
          >
            ▶
          </Box>
        </Box>
      )}

      {kind === "audio" && !isBroken && (
        <Box
          h={PREVIEW_HEIGHT}
          bg={placeholderBg}
          borderRadius="md"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <SpeakerIcon boxSize="22px" color={mutedText} />
        </Box>
      )}

      <Text fontSize="xs" mt={1} noOfLines={1} color={textColor}>
        {item.name}
      </Text>
    </Box>
  )
}

export default MediaPoolTile
