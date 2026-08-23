/*
 * components for rendering the row and column headers in the presentation editor, including controls for adding/removing screens and frames, and toggling audio mute.
 */
import React from "react"
import { TIMELINE_METRICS } from "./timelineMetrics"
import { groupLanes } from "../utils/screenRowModel"
import { laneFocusBleed, laneFocusShift, laneKey } from "../utils/laneFocus"

import type { RefObject, ReactNode } from "react"
import type { CollapsedGroups, HeaderActions, Lane } from "../../types"

interface RowHeadersProps {
  rows: Lane[]
  collapsedGroups: CollapsedGroups
  onToggleGroupCollapsed: (group: string) => void
  onAddVisualLayer: (screen: number) => void
  onRemoveVisualLayer: (screen: number, layer: number) => void
  onAddAudioTrack: () => void
  maxVisualLayers: number
  maxAudioTracks: number
  gap: number
  rowHeight: number
  screenCount: number
  isAudioMuted: boolean
  screenIcon: string
  headerActionsRef: RefObject<HeaderActions>
  /** Row index of the focused lane, or -1. */
  focusedRowIndex?: number
  onFocusLane?: (laneKey: string) => void
}

interface ColumnHeadersProps {
  xLabels: string[]
  cueIndex: number
  bgCurrentFrame: string
  bgColorIndex: string
  activeFrameBorderColor?: string
  inactiveFrameBorderColor?: string
  rowHeight: number
  columnWidth: number
  indexCount: number
  frameHeaderHeight: number
  headerActionsRef: RefObject<HeaderActions>
  /** Omitted while copying, when a header click means "cancel" instead. */
  onSelectFrame?: (index: number) => void
}
import { Box, Text, IconButton, Button, Tooltip } from "@chakra-ui/react"
import {
  AddIcon,
  MinusIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "@chakra-ui/icons"
import { SpeakerIcon, SpeakerMutedIcon } from "../../lib/icons"
import trashIcon from "../../public/icons/trash.svg"

/**
 * Timeline palette, taken from the editor design draft.
 *
 * The draft builds depth out of four near-black violets rather than one flat
 * surface, and puts every accent on small light chips with dark text instead of
 * colouring whole rows. That is what stops the timeline reading as a wall of
 * saturated blocks.
 */
const TIMELINE_PALETTE = {
  /**
   * Group-start row: the screen's own identity. Light violet, a shade below the
   * original purple.200 so it sits better against the dark timeline.
   */
  screenRow: "#cbb0ee",
  /** Layer rows, a step darker so they read as subordinate to their screen. */
  laneRow: "#ab89d6",
  /**
   * Audio lives in a different colour family entirely, as the design draft
   * does. Sharing one scroller with the screens is deliberate -- their row
   * indices are the same coordinate space the grid and every hit test use --
   * so the separation has to be carried by colour rather than by layout.
   */
  audioRow: "#7fd4bd",
  audioLaneRow: "#5fb9a2",
  audioBorder: "#2f6b5f",
  audioAccent: "#d8f4ec",
  /** Track controls: one family, revealed on hover over the gutter. */
  controlBg: "#3a2447",
  controlBgDanger: "#5a1f3a",
  controlBorder: "#6d5a7d",
  controlText: "#f0e4ff",
  /** Panel behind a group. */
  groupPanel: "#241333",
  border: "#4a2d63",
  borderSubtle: "#3a2447",
  accent: "#c084fc",
  /** Light chip carrying dark text -- screen badges, the active frame. */
  chip: "#c79dff",
  chipText: "#160b1f",
  textPrimary: "#f0e4ff",
  textSecondary: "#cbb6dd",
  textMuted: "#8b7499",
}

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
  focusedRowIndex = -1,
  onFocusLane = () => {},
}: RowHeadersProps): ReactNode => {
  const renderLaneHeader = (row: Lane): ReactNode => {
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
        bg={
          row.y === focusedRowIndex
            ? isAudio
              ? TIMELINE_PALETTE.audioAccent
              : TIMELINE_PALETTE.chip
            : isAudio
              ? row.groupStart
                ? TIMELINE_PALETTE.audioRow
                : TIMELINE_PALETTE.audioLaneRow
              : row.groupStart
                ? TIMELINE_PALETTE.screenRow
                : TIMELINE_PALETTE.laneRow
        }
        color={TIMELINE_PALETTE.chipText}
        border="1px solid"
        borderWidth={row.y === focusedRowIndex ? "2px" : "1px"}
        borderColor={
          row.y === focusedRowIndex
            ? TIMELINE_PALETTE.accent
            : isAudio
              ? TIMELINE_PALETTE.audioBorder
              : row.groupStart
                ? TIMELINE_PALETTE.accent
                : TIMELINE_PALETTE.border
        }
        borderRadius="7px"
        h={
          row.y === focusedRowIndex
            ? `${rowHeight + laneFocusBleed(rowHeight)}px`
            : `${rowHeight}px`
        }
        transform={`translateY(${
          row.y === focusedRowIndex
            ? -laneFocusBleed(rowHeight) / 2
            : laneFocusShift(row.y, focusedRowIndex, rowHeight)
        }px)`}
        width={`${TIMELINE_METRICS.rowHeaderWidth}px`}
        position="relative"
        px="8px"
        cursor="pointer"
        onClick={(event) => {
          // Buttons inside the cell keep their own behaviour.
          if (
            (event.target as HTMLElement).closest("button, [role='menuitem']")
          ) {
            return
          }
          onFocusLane(laneKey(row))
        }}
        boxShadow={
          row.y === focusedRowIndex
            ? "0 0 0 3px rgba(192, 132, 252, 0.35), 0 6px 18px rgba(60, 16, 96, 0.45)"
            : "none"
        }
        zIndex={row.y === focusedRowIndex ? 2 : 1}
        transition="background-color 120ms ease, border-color 120ms ease, box-shadow 140ms ease, height 140ms ease, transform 140ms ease"
        _hover={{
          borderColor: isAudio
            ? TIMELINE_PALETTE.audioAccent
            : TIMELINE_PALETTE.accent,
        }}
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
                color={TIMELINE_PALETTE.chipText}
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
                    width="34px"
                    height="34px"
                    aria-hidden="true"
                  />
                  <Text
                    as="span"
                    position="absolute"
                    top="43%"
                    left="50%"
                    transform="translate(-50%, -50%)"
                    fontSize="13px"
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
                color={TIMELINE_PALETTE.controlText}
                bg={TIMELINE_PALETTE.controlBgDanger}
                borderWidth="1px"
                borderColor={TIMELINE_PALETTE.controlBorder}
                borderRadius="6px"
                position="absolute"
                top="50%"
                right="4px"
                transform="translateY(-50%)"
                opacity={0}
                visibility="hidden"
                transition="opacity 120ms ease"
                _groupHover={{ opacity: 1, visibility: "visible" }}
                aria-label={`Remove layer from screen ${row.screen}`}
                title={
                  canRemoveVisualLayer
                    ? "Remove layer"
                    : "Base layer cannot be removed"
                }
                isDisabled={!canRemoveVisualLayer}
                onClick={(event) => {
                  event.stopPropagation()
                  // canRemoveVisualLayer above requires Number(row.layer ?? 0) > 0,
                  // so the layer is defined wherever this button is enabled.
                  onRemoveVisualLayer(row.screen, row.layer as number)
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
                  color={TIMELINE_PALETTE.controlText}
                  bg={TIMELINE_PALETTE.controlBgDanger}
                  borderWidth="1px"
                  borderColor={TIMELINE_PALETTE.controlBorder}
                  borderRadius="6px"
                  height="20px"
                  minW="60px"
                  px="4px"
                  fontSize="10px"
                  lineHeight="1"
                  opacity={0}
                  visibility="hidden"
                  transition="opacity 120ms ease"
                  _groupHover={{ opacity: 1, visibility: "visible" }}
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
                  bottom="-14px"
                  display="flex"
                  gap="4px"
                  zIndex="30"
                  opacity={0}
                  visibility="hidden"
                  transition="opacity 120ms ease"
                  _groupHover={{ opacity: 1, visibility: "visible" }}
                >
                  {canAddVisualLayer && (
                    <Button
                      leftIcon={<AddIcon boxSize="8px" />}
                      size="xs"
                      variant="solid"
                      color={TIMELINE_PALETTE.controlText}
                      bg={TIMELINE_PALETTE.controlBg}
                      border="1px solid rgba(34, 139, 34, 0.45)"
                      borderRadius="6px"
                      height="20px"
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
                      color={TIMELINE_PALETTE.chipText}
                      bg={TIMELINE_PALETTE.accent}
                      borderWidth="1px"
                      borderColor={TIMELINE_PALETTE.controlBorder}
                      borderRadius="6px"
                      height="20px"
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
            opacity={0}
            visibility="hidden"
            transition="opacity 120ms ease"
            _groupHover={{ opacity: 1, visibility: "visible" }}
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
  }

  /**
   * Each screen's lanes live inside one bordered container so the gutter reads
   * as "these are the tracks of screen N" rather than a flat list of rows.
   *
   * The wrapper spans `laneCount` parent tracks and re-declares the same track
   * sizes inside, so it contributes no box of its own and the 1:1 alignment
   * with the react-grid-layout rows survives. The border is an `outline`, not a
   * `border`: a 2px border would grow the box and push every lane below it out
   * of alignment with the grid.
   */
  return groupLanes(rows).map((group) => {
    const groupRows = rows.slice(group.startY, group.startY + group.laneCount)
    const isAudioGroup = group.kind === "audio" || group.kind === "audio-track"
    const groupHoldsFocus =
      focusedRowIndex >= group.startY &&
      focusedRowIndex < group.startY + group.laneCount
    const groupSpanHeight =
      group.laneCount * rowHeight + Math.max(group.laneCount - 1, 0) * gap

    return (
      <Box
        key={group.group}
        className="lane-group"
        data-testid={`lane-group-${group.group}`}
        role="group"
        aria-label={group.label}
        gridRow={`span ${group.laneCount}`}
        // Grows with the focused lane it contains, so the frame keeps enclosing
        // its lanes; the extra height is absorbed by the gutter between groups.
        h={
          groupHoldsFocus
            ? `${groupSpanHeight + laneFocusBleed(rowHeight)}px`
            : undefined
        }
        mt={groupHoldsFocus ? `-${laneFocusBleed(rowHeight) / 2}px` : undefined}
        transition="height 140ms ease, margin-top 140ms ease"
        display="grid"
        gridTemplateRows={`repeat(${group.laneCount}, ${rowHeight}px)`}
        gap={`${gap}px`}
        marginRight={`${gap}px`}
        // A dark fill shows through the 10px gaps between lanes, which is what
        // actually makes the run read as one container -- the lane cells are
        // light purple, so without it the frame alone just adds another line in
        // the same colour as every lane border. Background and outline are both
        // outside the box model, so alignment with the grid rows is untouched.
        bg={TIMELINE_PALETTE.groupPanel}
        // Dashed when collapsed: until now the only signal that a group was
        // collapsed was its label text.
        outline={`2px ${group.collapsed ? "dashed" : "solid"} ${
          isAudioGroup ? TIMELINE_PALETTE.audioBorder : TIMELINE_PALETTE.accent
        }`}
        outlineOffset="0px"
        borderRadius="12px"
        position="relative"
        // The add-layer and add-screen buttons deliberately overhang.
        overflow="visible"
      >
        {groupRows.map(renderLaneHeader)}
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
  onSelectFrame,
}: ColumnHeadersProps): ReactNode => {
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
        cursor={onSelectFrame ? "pointer" : undefined}
        onClick={(event) => {
          // The add/remove frame buttons overhang into this box.
          if (
            (event.target as HTMLElement).closest("button, [role='menuitem']")
          ) {
            return
          }
          onSelectFrame?.(index)
        }}
        display="flex"
        alignItems="center"
        justifyContent="center"
        // The active chip is light with dark text; the rest are deep with muted
        // text, so exactly one frame reads as current.
        color={TIMELINE_PALETTE.chipText}
        fontSize="12px"
        fontWeight={index === cueIndex ? 700 : 600}
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
