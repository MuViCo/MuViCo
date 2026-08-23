/*
 * components for rendering the row and column headers in the presentation editor, including controls for adding/removing screens and frames, and toggling audio mute.
 */
import React from "react"
import { TIMELINE_METRICS } from "./timelineMetrics"
import { Box, Text, IconButton, Button, Tooltip } from "@chakra-ui/react"
import {
  AddIcon,
  MinusIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "@chakra-ui/icons"
import { SpeakerIcon, SpeakerMutedIcon } from "../../lib/icons"
import trashIcon from "../../public/icons/trash.svg"

// Base component for rendering row headers, memoized for performance optimization. Displays screen labels and an audio row with a mute/unmute button, as well as controls for adding/removing screens.
const RowHeadersBase = ({
  rows,
  collapsedGroups,
  onToggleGroupCollapsed,
  onAddVisualLayer,
  onRemoveVisualLayer,
  onAddAudioTrack,
  maxVisualLayers,
  maxAudioTracks,
  gap,
  rowHeight,
  screenCount,
  isAudioMuted,
  screenIcon,
  headerActionsRef,
}) => {
  return rows.map((row) => {
    const isAudio = row.kind === "audio-track" || row.kind === "audio"
    const groupRows = rows.filter((candidate) => candidate.group === row.group)
    const lastGroupRow = groupRows[groupRows.length - 1]
    const isVisualGroupEnd =
      !isAudio &&
      (row.kind === "layer" || row.kind === "screen") &&
      Number(row.y) === Number(lastGroupRow?.y)
    const isLastScreenStart =
      row.groupStart && !isAudio && Number(row.screen) === Number(screenCount)
    const isLastScreenEnd =
      isVisualGroupEnd && Number(row.screen) === Number(screenCount)
    const isCollapsed = Boolean(collapsedGroups?.[row.group])
    const canAddVisualLayer =
      isVisualGroupEnd &&
      Number(row.count ?? row.laneTotal ?? 1) < maxVisualLayers
    const canRemoveVisualLayer =
      row.kind === "layer" &&
      !isAudio &&
      Number(row.layer ?? 0) > 0 &&
      Boolean(row.canRemoveLayer)
    const canAddAudioTrack =
      row.groupStart &&
      isAudio &&
      Number(row.count ?? row.laneTotal ?? 1) < maxAudioTracks

    return (
      <Box
        key={`${row.kind}-${row.group}-${row.layer ?? "merged"}-${row.y}`}
        display="flex"
        alignItems="center"
        justifyContent={row.groupStart ? "space-between" : "center"}
        bg={isAudio ? "rgb(204, 46, 252)" : "purple.200"}
        border="2px solid #b55fe0"
        marginRight={`${gap}px`}
        h={`${rowHeight}px`}
        width={`${TIMELINE_METRICS.rowHeaderWidth}px`}
        position="relative"
        px="6px"
      >
        {row.groupStart && (
          <IconButton
            icon={isCollapsed ? <ChevronRightIcon /> : <ChevronDownIcon />}
            size="xs"
            variant="ghost"
            color="black"
            aria-label={isCollapsed ? "Expand row group" : "Collapse row group"}
            title={isCollapsed ? "Expand" : "Collapse"}
            onClick={(event) => {
              event.stopPropagation()
              onToggleGroupCollapsed(row.group)
            }}
          />
        )}

        <Box
          fontWeight="bold"
          color="black"
          display="flex"
          alignItems="center"
          justifyContent="center"
          gap="4px"
          flex="1"
          minW={0}
        >
          {isAudio && row.groupStart ? (
            <>
              <IconButton
                icon={
                  isAudioMuted ? (
                    <SpeakerMutedIcon boxSize="36px" />
                  ) : (
                    <SpeakerIcon boxSize="36px" />
                  )
                }
                sx={{
                  width: "44px",
                  height: "44px",
                  padding: "4px",
                }}
                _hover={{ color: "rgb(99, 76, 107)" }}
                textColor={"black"}
                variant="ghost"
                draggable={false}
                aria-label="Mute/unmute audio"
                title={isAudioMuted ? "Unmute audio" : "Mute audio"}
                onMouseDown={(e) => {
                  e.stopPropagation()
                  headerActionsRef.current.toggleAudioMute()
                }}
              />
              <Text as="span" fontSize="13px" lineHeight="1" noOfLines={1}>
                {row.collapsed ? `${row.count} tracks` : row.label}
              </Text>
            </>
          ) : !isAudio && row.groupStart ? (
            <>
              <Tooltip
                label="Screen: one of the physical displays your presentation opens a window on."
                placement="top"
                hasArrow
                openDelay={300}
              >
                <Box
                  position="relative"
                  width="50px"
                  height="50px"
                  flexShrink={0}
                >
                  <Box
                    as="img"
                    src={screenIcon}
                    alt=""
                    width="50px"
                    height="50px"
                    aria-hidden="true"
                  />
                  <Text
                    as="span"
                    position="absolute"
                    top="43%"
                    left="50%"
                    transform="translate(-50%, -50%)"
                    fontSize="19px"
                    fontWeight="700"
                    lineHeight="1"
                    color="black"
                    pointerEvents="none"
                  >
                    {row.screen}
                  </Text>
                </Box>
              </Tooltip>
              <Text as="span" fontSize="13px" lineHeight="1" noOfLines={1}>
                {row.collapsed ? `${row.count} layers` : row.label}
              </Text>
            </>
          ) : !isAudio ? (
            <Tooltip
              label="Layer: elements stacked on the same screen. Higher layers are shown on top of lower ones."
              placement="top"
              hasArrow
              openDelay={300}
            >
              <Text as="span" fontSize="13px" lineHeight="1" noOfLines={1}>
                {row.label}
              </Text>
            </Tooltip>
          ) : (
            <Text as="span" fontSize="13px" lineHeight="1" noOfLines={1}>
              {row.label}
            </Text>
          )}
        </Box>

        {!isAudio && (
          <>
            {row.kind === "layer" && Number(row.layer ?? 0) > 0 && (
              <IconButton
                icon={<MinusIcon boxSize="9px" />}
                size="xs"
                variant="solid"
                color="black"
                bg="orange.100"
                border="1px solid rgba(221, 107, 32, 0.48)"
                borderRadius="6px"
                position="absolute"
                top="50%"
                right="4px"
                transform="translateY(-50%)"
                aria-label={`Remove layer from screen ${row.screen}`}
                title={
                  canRemoveVisualLayer
                    ? "Remove layer"
                    : "Base layer cannot be removed"
                }
                isDisabled={!canRemoveVisualLayer}
                onClick={(event) => {
                  event.stopPropagation()
                  onRemoveVisualLayer(row.screen, row.layer)
                }}
                _hover={{
                  bg: "orange.50",
                  borderColor: "orange.400",
                  color: "black",
                }}
                _active={{ bg: "white" }}
                boxShadow="0 2px 4px rgba(0,0,0,0.2)"
                zIndex="10"
              />
            )}

            {isLastScreenStart && screenCount > 1 && (
              <Box
                position="absolute"
                top="4px"
                right="4px"
                display="flex"
                flexDirection="column"
                alignItems="stretch"
                gap="3px"
                zIndex="10"
              >
                <Button
                  leftIcon={<MinusIcon boxSize="8px" />}
                  size="xs"
                  variant="solid"
                  color="black"
                  bg="red.100"
                  border="1px solid rgba(197, 48, 48, 0.45)"
                  borderRadius="6px"
                  height="20px"
                  minW="60px"
                  px="4px"
                  fontSize="10px"
                  lineHeight="1"
                  aria-label="Remove screen"
                  title="Remove screen"
                  onClick={(event) => {
                    event.stopPropagation()
                    headerActionsRef.current.decreaseScreenCount()
                  }}
                  _hover={{
                    bg: "red.50",
                    borderColor: "red.400",
                    color: "black",
                  }}
                  _active={{ bg: "white" }}
                  boxShadow="0 2px 4px rgba(0,0,0,0.18)"
                >
                  Screen
                </Button>
              </Box>
            )}

            {isVisualGroupEnd &&
              (canAddVisualLayer || (isLastScreenEnd && screenCount < 8)) && (
                <Box
                  position="absolute"
                  left="6px"
                  right="6px"
                  bottom="-16px"
                  display="flex"
                  gap="4px"
                  zIndex="30"
                >
                  {canAddVisualLayer && (
                    <Button
                      leftIcon={<AddIcon boxSize="8px" />}
                      size="xs"
                      variant="solid"
                      color="black"
                      bg="green.100"
                      border="1px solid rgba(34, 139, 34, 0.45)"
                      borderRadius="6px"
                      height="22px"
                      flex="1"
                      minW="0"
                      px="4px"
                      fontSize="10px"
                      lineHeight="1"
                      aria-label={`Add layer to screen ${row.screen}`}
                      title="Add layer"
                      onClick={(event) => {
                        event.stopPropagation()
                        onAddVisualLayer(row.screen)
                      }}
                      _hover={{
                        bg: "green.50",
                        borderColor: "green.400",
                        color: "black",
                      }}
                      _active={{ bg: "white" }}
                      boxShadow="0 2px 4px rgba(0,0,0,0.2)"
                    >
                      Layer
                    </Button>
                  )}

                  {isLastScreenEnd && screenCount < 8 && (
                    <Button
                      leftIcon={<AddIcon boxSize="8px" />}
                      size="xs"
                      variant="solid"
                      color="black"
                      bg="blue.100"
                      border="1px solid rgba(49, 130, 206, 0.48)"
                      borderRadius="6px"
                      height="22px"
                      flex="1"
                      minW="0"
                      px="4px"
                      fontSize="10px"
                      lineHeight="1"
                      aria-label="Add screen"
                      title="Add screen"
                      onClick={(event) => {
                        event.stopPropagation()
                        headerActionsRef.current.increaseScreenCount()
                      }}
                      _hover={{
                        bg: "blue.50",
                        borderColor: "blue.400",
                        color: "black",
                      }}
                      _active={{ bg: "white" }}
                      boxShadow="0 2px 4px rgba(0,0,0,0.18)"
                    >
                      Screen
                    </Button>
                  )}
                </Box>
              )}
          </>
        )}

        {row.groupStart && isAudio && (
          <IconButton
            icon={<AddIcon />}
            size="xs"
            variant="solid"
            color="black"
            position="absolute"
            bottom="1px"
            right="1px"
            aria-label="Add audio track"
            title="Add audio track"
            isDisabled={!canAddAudioTrack}
            onClick={(event) => {
              event.stopPropagation()
              onAddAudioTrack()
            }}
            _hover={{
              bg: "rgba(72, 187, 120, 0.22)",
              borderColor: "green.400",
              color: "black",
              transform: "scale(1.1)",
            }}
            _active={{ bg: "white" }}
            boxShadow="0 2px 4px rgba(0,0,0,0.2)"
            zIndex="10"
          />
        )}
      </Box>
    )
  })
}

// Base component for rendering column headers, memoized for performance optimization. Displays frame labels and controls for adding/removing frames.
const ColumnHeadersBase = ({
  xLabels,
  cueIndex,
  bgCurrentFrame,
  bgColorIndex,
  activeFrameBorderColor = "#7a15b8",
  inactiveFrameBorderColor = "#b31bff",
  rowHeight,
  columnWidth,
  indexCount,
  frameHeaderHeight,
  headerActionsRef,
}) => {
  return xLabels.map((label, index) => (
    <Box
      key={label}
      position="relative"
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      role="group"
      h={`${frameHeaderHeight}px`}
    >
      <Box
        className="x-index-label"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg={index === cueIndex ? bgCurrentFrame : bgColorIndex}
        border={`${index === cueIndex ? 4 : 2}px solid`}
        borderColor={
          index === cueIndex ? activeFrameBorderColor : inactiveFrameBorderColor
        }
        boxShadow={
          index === cueIndex
            ? "0 0 0 1px rgba(255, 255, 255, 0.36), 0 8px 16px rgba(60, 16, 96, 0.26)"
            : "none"
        }
        transition="border-color 120ms ease, box-shadow 140ms ease"
        h={`${frameHeaderHeight}px`}
        width={`${columnWidth}px`}
      >
        <Text fontWeight="bold" color="black">
          {label}
        </Text>
        <Box
          position="absolute"
          top="0"
          right="-14px"
          h={`${frameHeaderHeight}px`}
          w="28px"
          aria-hidden="true"
          zIndex="1"
        />
        <IconButton
          icon={<AddIcon />}
          variant="solid"
          color="black"
          position="absolute"
          top="0"
          right="0"
          transform="translateX(65%)"
          h={`${frameHeaderHeight}px`}
          w="30px"
          minW="20px"
          borderRadius="0"
          isDisabled={indexCount >= 100}
          aria-label="Add Frame"
          title="Add Frame"
          onClick={() => {
            headerActionsRef.current.addIndex(index)
          }}
          opacity={index === xLabels.length - 1 ? 0.45 : 0}
          pointerEvents={index === xLabels.length - 1 ? "auto" : "none"}
          bg={
            index === xLabels.length - 1
              ? "rgba(255,255,255,0.12)"
              : "transparent"
          }
          backdropFilter={index === xLabels.length - 1 ? "blur(2px)" : "none"}
          _groupHover={{
            opacity: 1,
            pointerEvents: "auto",
          }}
          _hover={{
            bg: "rgba(125, 252, 135, 0.75)",
            borderColor: "green.400",
            color: "black",
            borderRadius: "6px",
            transform: "translateX(65%) scale(1.03)",
          }}
          _active={{ bg: "transparent" }}
          boxShadow="0 2px 4px rgba(0,0,0,0.2)"
          zIndex="20"
        />
        {index !== 0 && (
          <IconButton
            icon={<AddIcon />}
            variant="solid"
            color="black"
            position="absolute"
            top="0"
            left="0"
            transform="translateX(-65%)"
            h={`${frameHeaderHeight}px`}
            w="30px"
            minW="20px"
            borderRadius="0"
            isDisabled={indexCount >= 100}
            aria-label="Add Frame Before"
            title="Add Frame Before"
            onClick={() => {
              headerActionsRef.current.addIndex(index - 1)
            }}
            opacity="0"
            pointerEvents="none"
            _groupHover={
              indexCount >= 100
                ? {}
                : {
                    opacity: 1,
                    pointerEvents: "auto",
                  }
            }
            _hover={{
              bg: "rgba(125, 252, 135, 0.75)",
              borderColor: "green.400",
              color: "black",
              borderRadius: "6px",
              transform: "translateX(-65%) scale(1.03)",
            }}
            _active={{ bg: "transparent" }}
            boxShadow="0 2px 4px rgba(0,0,0,0.2)"
            zIndex="20"
          />
        )}
        {index !== 0 && (
          <IconButton
            icon={
              <Box
                as="img"
                src={trashIcon}
                alt=""
                aria-hidden="true"
                w="24px"
                h="24px"
              />
            }
            size="xs"
            variant="solid"
            color="black"
            position="absolute"
            top="1%"
            left="50%"
            transform="translate(-50%, -50%)"
            w="36px"
            minW="36px"
            isDisabled={indexCount <= 1}
            aria-label="Remove Frame"
            title="Remove Frame"
            onClick={() => {
              headerActionsRef.current.removeIndex(index)
            }}
            opacity="0"
            pointerEvents="none"
            _groupHover={
              indexCount <= 1
                ? {}
                : {
                    opacity: 1,
                    pointerEvents: "auto",
                  }
            }
            _hover={{
              bg: "rgba(253, 97, 97, 0.75)",
              borderColor: "red.400",
              color: "black",
              borderRadius: "6px",
              transform: "translate(-50%, -50%) scale(1.03)",
            }}
            _active={{ bg: "transparent" }}
            boxShadow="0 2px 4px rgba(0,0,0,0.2)"
            zIndex="10"
          />
        )}
      </Box>
    </Box>
  ))
}

export const RowHeaders = React.memo(RowHeadersBase)
export const ColumnHeaders = React.memo(ColumnHeadersBase)
