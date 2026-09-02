/**
 * One draggable tile in the media pool.
 *
 * The three media kinds need genuinely different previews -- a still, a video
 * frame, a single icon -- so the whole tile lives here rather than as three
 * branches inside CuesForm's render.
 */

import {
  Box,
  IconButton,
  Image,
  Text,
  useColorModeValue,
} from "@chakra-ui/react"
import { DeleteIcon } from "@chakra-ui/icons"
import { SpeakerIcon } from "../../lib/icons"
import mediaStore from "./mediaFileStore"

import { dragDataForMedia, mediaKind } from "../utils/mediaKind"

import type { MediaLibraryItem } from "../../types"

interface MediaPoolTileProps {
  item: MediaLibraryItem
  onDelete: (item: MediaLibraryItem) => void
  suppressDragGhost: (dataTransfer: DataTransfer | null) => void
}

const PREVIEW_HEIGHT = "100px"

const MediaPoolTile = ({
  item,
  onDelete,
  suppressDragGhost,
}: MediaPoolTileProps) => {
  const textColor = useColorModeValue("gray.800", "whiteAlpha.900")
  const mutedText = useColorModeValue("gray.600", "whiteAlpha.500")
  const placeholderBg = useColorModeValue("blackAlpha.50", "whiteAlpha.200")
  const kind = mediaKind(item.type)

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
      position="relative"
      border="2px solid"
      borderColor="purple.300"
      borderRadius="md"
      p={2}
      cursor="grab"
      _active={{ cursor: "grabbing" }}
      _hover={{ borderColor: "purple.500", bg: "whiteAlpha.100" }}
    >
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

      {kind === "image" && (
        <Image
          src={item.url}
          alt={item.name}
          maxH={PREVIEW_HEIGHT}
          objectFit="contain"
          w="100%"
        />
      )}

      {kind === "video" && (
        <Box position="relative" borderRadius="md" overflow="hidden">
          {/* The media fragment asks for a frame just past the start: at
              exactly 0s some encodes hand back a black frame. `preload` is
              metadata only, so this costs a range request, not the file. */}
          <Box
            as="video"
            data-testid={`video-preview-${item.id}`}
            src={item.url ? `${item.url}#t=0.1` : undefined}
            muted
            playsInline
            preload="metadata"
            h={PREVIEW_HEIGHT}
            w="100%"
            objectFit="contain"
            // The tile owns the drag; a video element would swallow the press.
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

      {kind === "audio" && (
        <Box
          h={PREVIEW_HEIGHT}
          bg={placeholderBg}
          borderRadius="md"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <SpeakerIcon boxSize="32px" color={mutedText} />
        </Box>
      )}

      <Text fontSize="xs" mt={1} noOfLines={1} color={textColor}>
        {item.name}
      </Text>
    </Box>
  )
}

export default MediaPoolTile
