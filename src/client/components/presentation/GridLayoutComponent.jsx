import React, { useState, useEffect, useMemo } from "react"
import { Box, IconButton, Tooltip, Text, Menu, MenuButton, MenuList, Portal } from "@chakra-ui/react" // Ensure Text is imported
import {
  DeleteIcon,
  CopyIcon,
  RepeatIcon,
  ArrowForwardIcon,
  EditIcon,
  ChevronDownIcon
} from "@chakra-ui/icons"
import GridLayout from "react-grid-layout"
import "react-grid-layout/css/styles.css"
import { useDispatch } from "react-redux"
import { updatePresentation, removeCue } from "../../redux/presentationReducer"
import { useCustomToast } from "../utils/toastUtils"
import Dialog from "../utils/AlertDialog"
import { getAudioRow } from "../utils/fileTypeUtils"

const renderElementBasedOnIndex = (currentIndex, cues, cue) => {
  if (cue.index > currentIndex) {
    return false
  } else if (cue.index === currentIndex) {
    return true
  } else if (cue.index < currentIndex) {
    const audioElementIndexes = cues
      .filter((c) => c.cueType === "audio")
      .map((c) => c.index)
      .sort((a, b) => a - b)
    if (
      // the element is the last element in audio row
      cue.index === audioElementIndexes.at(-1) ||
      // or the next element's index is bigger that current index
      audioElementIndexes[audioElementIndexes.indexOf(cue.index) + 1] >
        currentIndex
    ) {
      return true
    }
    return false
  }
}

const renderMedia = (cue, cueIndex, cues, isShowMode, isAudioMuted, screenCount) => {
  
  if (cue.file == null) {
      return (
        <Box
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: cue.color || "#e014ee",
            borderRadius: "10px",
          }}
        />
      )
  }
  
  if (cue.file.type.startsWith("video/")) {
    return (
      <video
        src={cue.file.url}
        draggable={false}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          borderRadius: "10px",
          userSelect: "none",
        }}
        muted
        playsInline
        controls={false}
      />
    )
  } else if (cue.file.type.startsWith("image/")) {
    if (cue.file.name.includes("blank")) {
      return (
        <Box
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: cue.color || "#e014ee",
            borderRadius: "10px",
          }}
        />
      )
    }
    return (
      <img // Thumbail for image
        src={cue.file.url || `/${cue.file.name}`}
        alt={cue.name}
        draggable={false}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          borderRadius: "10px",
          userSelect: "none",
        }}
      />
    )
  } else if (
    isShowMode &&
    cue.cueType === "audio" &&
    renderElementBasedOnIndex(cueIndex, cues, cue)
  ) {
    return (
      <audio
        src={cue.file.url}
        autoPlay
        loop={cue.loop}
        controls
        muted={isAudioMuted}
        style={{ width: "100%", pointerEvents: "auto" }}
      />
    )
  }
}

const GridLayoutComponent = ({
  id,
  layout,
  cues,
  setStatus,
  setCopiedCue,
  setIsCopied,
  columnWidth,
  rowHeight,
  gap,
  isShowMode,
  cueIndex,
  isAudioMuted,
  setSelectedCue,
  setIsToolboxOpen,
  indexCount,
  setShowAlert,
  setAlertData,
  screenCount,
  isDragging = false,
  draggingCueId = null,
}) => {
  const showToast = useCustomToast()
  const dispatch = useDispatch()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [cueToRemove, setCueToRemove] = useState(null)
  const [currentLayout, setCurrentLayout] = useState(layout)

  const getCueDuration = (cue) => {
    const parsedDuration = Number(cue?.duration)
    return Number.isInteger(parsedDuration) && parsedDuration > 0 ? parsedDuration : 1
  }

  const cueVisualDurationMap = useMemo(() => {
    const cuesByScreen = new Map()

    cues.forEach((cue) => {
      const cueIndex = Number(cue?.index)
      const cueScreen = Number(cue?.screen)

      if (!Number.isInteger(cueIndex) || !Number.isInteger(cueScreen)) {
        return
      }

      if (!cuesByScreen.has(cueScreen)) {
        cuesByScreen.set(cueScreen, [])
      }

      cuesByScreen.get(cueScreen).push(cue)
    })

    const durationMap = new Map()
    cuesByScreen.forEach((screenCues) => {
      const sortedCues = screenCues
        .slice()
        .sort((a, b) => Number(a.index) - Number(b.index))

      sortedCues.forEach((cue, cuePosition) => {
        const nextCue = sortedCues[cuePosition + 1]
        const cueIndex = Number(cue.index)
        const endIndex = nextCue ? Number(nextCue.index) - 1 : indexCount - 1
        durationMap.set(cue._id, Math.max(1, endIndex - cueIndex + 1))
      })
    })

    return durationMap
  }, [cues, indexCount])

  const getCueVisualDuration = (cue) => {
    return cueVisualDurationMap.get(cue?._id) ?? 1
  }

  const layoutWidthMap = useMemo(() => {
    const nextMap = new Map()
    currentLayout.forEach((item) => {
      const parsedWidth = Number(item?.w)
      if (Number.isInteger(parsedWidth) && parsedWidth > 0) {
        nextMap.set(item.i, parsedWidth)
      }
    })
    return nextMap
  }, [currentLayout])

  const getCueById = (cueId) => cues.find((cue) => cue._id === cueId)

  const getLayoutWidth = (cueId, fallbackWidth) => {
    return layoutWidthMap.get(cueId.toString()) ?? fallbackWidth
  }

  const hasOverlapWithOtherCues = (cueId, startIndex, screen, duration) => {
    const endIndex = startIndex + duration - 1
    return cues.some((otherCue) => {
      if (otherCue._id === cueId || Number(otherCue.screen) !== Number(screen)) {
        return false
      }

      const otherStart = Number(otherCue.index)
      const otherEnd = otherStart + getCueDuration(otherCue) - 1
      return !(endIndex < otherStart || startIndex > otherEnd)
    })
  }

  const revertLayoutItem = (itemId, previousItem) => {
    const revertedLayout = currentLayout.map((item) => {
      if (item.i === itemId) {
        return {
          ...item,
          x: previousItem.x,
          y: previousItem.y,
          w: previousItem.w,
          h: 1,
        }
      }
      return item
    })
    setCurrentLayout(revertedLayout)
  }

  useEffect(() => {
    setCurrentLayout(layout)
  }, [layout])

  const handleLoopToggle = async (cue) => {
    const updatedCue = {
      cueId: cue._id,
      cueName: cue.name,
      index: cue.index,
      screen: cue.screen,
      file: cue.file,
      color: cue.color,
      loop: !cue.loop,
    }

    const result = await dispatch(updatePresentation(id, updatedCue))

    const updatedCueFromRedux = result?.payload

    try {
      showToast({
        title: updatedCueFromRedux.loop ? "Loop enabled" : "Loop disabled",
        description: `${updatedCueFromRedux.name} will ${updatedCueFromRedux.loop ? "loop" : "play once"}`,
        status: "info",
        duration: 2000,
      })
    } catch (e) {
      console.log("Error printing toast about loop toggle: ", e)
    }
  }

  const handleRemoveItem = (cueId) => {
    setCueToRemove(cueId)
    setIsDialogOpen(true)
  }

  const handleConfirmRemove = async () => {
    if (cueToRemove) {
      try {
        await dispatch(removeCue(id, cueToRemove))
        const cue = cues.find((cue) => cue._id === cueToRemove)
        showToast({
          title: "Element removed",
          description: `Element ${cue.name} has been removed.`,
          status: "success",
        })
      } catch (error) {
        console.error(error)
        const errorMessage = error.message || "An error occurred"
        showToast({
          title: "Error",
          description: errorMessage,
          status: "error",
        })
      }
    }
    setIsDialogOpen(false)
  }

  const handleEditItem= (cueId) => {
    const cue = cues.find(
      (cue) => cue._id === cueId
    )
    setSelectedCue(cue)
    setIsToolboxOpen(true)
  }

  const ShowModeCueButtons = (cue) => (
    <>
      {cue.file && cue.cueType === "audio" && (
        <IconButton
          icon={cue.loop ? <RepeatIcon /> : <ArrowForwardIcon />}
          disabled={true}
          _disabled={{
            cursor: "default",
            pointerEvents: "auto",
          }}
          size="lg"
          position="absolute"
          _hover={{}}
          backgroundColor="transparent"
          draggable={false}
          zIndex="10"
          top="60px"
          right="50px"
          aria-label={cue.loop ? `${cue.name} loops` : `${cue.name} plays once`}
          title={cue.loop ? "Loop enabled" : "Plays once"}
        />
      )}
    </>
  )
  const EditModeCueButtons = (cue) => (
    <Menu isLazy>
      <MenuButton
        as={IconButton}
        data-testid={`cue-menu-button-${cue._id}`}
        aria-label='Options'
        icon={<ChevronDownIcon />}
        backgroundColor="var(--chakra-colors-gray-700)" 
        _hover={{ backgroundColor: "var(--chakra-colors-gray-600)" }}  
        _active={{ backgroundColor: "var(--chakra-colors-gray-600)" }} 
        variant='outline'
        position="absolute"
        zIndex="10"
        top="3px"
        left={`${Math.max(columnWidth - 27, 3)}px`}
        size="xs"
      />
      <Portal>
        <MenuList
          background="transparent"
          margin="-5px 0 0 -13px"
          w="50px"
          paddingTop={0}
          paddingBottom={0}
          minW="none"
        >
          <IconButton
            icon={<DeleteIcon />}
            size="xs"
            w="100%"
            h="30px"
            borderRadius="0.375rem 0.375rem 0 0"
            _hover={{ bg: "red.500", color: "white" }}
            backgroundColor="red.300"
            draggable={false}
            aria-label={`Delete ${cue.name}`}
            title="Delete element"
            onMouseDown={(e) => {
              e.stopPropagation()
              handleRemoveItem(cue._id)
            }}
          />
          <IconButton
            icon={<EditIcon />}
            size="xs"
            w="100%"
            h="30px"
            borderRadius={0}
            _hover={{ bg: "orange.500", color: "white" }}
            backgroundColor="orange.300"
            draggable={false}
            aria-label={`Edit ${cue.name}`}
            title="Edit element"
            onMouseDown={(e) => {
              e.stopPropagation()
              handleEditItem(cue._id)
            }}
          />
          <IconButton
            icon={<CopyIcon />}
            size="xs"
            w="100%"
            h="30px"
            borderRadius={cue.file!=null ? (cue.cueType === "audio" ? "0" : "0 0 0.375rem 0.375rem") : "0 0 0.375rem 0.375rem"}
            _hover={{ bg: "gray.600", color: "white" }}
            backgroundColor="gray.500"
            draggable={false}
            aria-label={`Copy ${cue.name}`}
            title="Copy element"
            onMouseUp={(e) => {
              e.stopPropagation()
              setIsCopied(true)
              setCopiedCue(cue)
              setShowAlert(true)
              setAlertData({
                title: `Copying in progress for element "${cue.name}".`,
                description:
                  "Click on available places on the grid to paste. Click outside the grid to cancel.",
                status: "info",
              })
            }}
          />
          {cue.file!=null && cue.cueType === "audio" && (
            <IconButton
              icon={cue.loop ? <RepeatIcon /> : <ArrowForwardIcon />}
              size="xs"
              w="100%"
              h="30px"
              borderRadius="0 0 0.375rem 0.375rem"
              _hover={{ bg: "green.600", color: "white" }}
              backgroundColor="green.500"
              draggable={false}
              aria-label={`Loop audio ${cue.name}`}
              title={cue.loop ? "Disable loop" : "Enable loop"}
              onMouseDown={(e) => {
                e.stopPropagation()
                handleLoopToggle(cue)
              }}
            />
          )}
        </MenuList>
      </Portal>
    </Menu>
  )

  /**
   * Do not remove the `layout` parameter from the `handlePositionChange` function.
   * It is required for the function to work correctly.
   */
  const handlePositionChange = async (newLayout, oldItem, newItem) => {
    if (oldItem.x === newItem.x && oldItem.y === newItem.y && oldItem.w === newItem.w) {
      return
    }

    const cue = getCueById(newItem.i)
    if (!cue) {
      return
    }

    const audioRowYIndex = getAudioRow(screenCount) - 1
    const movingToAudioRow = newItem.y === audioRowYIndex
    const cueIsAudio = cue.cueType === "audio"

    if ((cueIsAudio && !movingToAudioRow) || (!cueIsAudio && movingToAudioRow)) {
      showToast({
        title: "Cannot move this file type here",
        description: "Keep audio elements to the audio row and visual elements to the visual rows.",
        status: "error",
      })

      const updatedLayout = currentLayout.map((item) => {
        // find the item that was moved with its ID and revert it to its old position
        if (item.i === newItem.i) {
          return {
            ...item,
            x: oldItem.x,
            y: oldItem.y,
            w: oldItem.w,
          }
        }
        return item
      })

      setCurrentLayout(updatedLayout)
      return
    }

    const movedDuration = getCueDuration(cue)
    const movedEndIndex = Number(newItem.x) + movedDuration - 1

    if (movedEndIndex >= indexCount || hasOverlapWithOtherCues(newItem.i, Number(newItem.x), Number(newItem.y + 1), movedDuration)) {
      showToast({
        title: "Cannot place element here",
        description: "Cue duration overlaps another cue or exceeds frame bounds.",
        status: "error",
      })
      revertLayoutItem(newItem.i, oldItem)
      return
    }

    const movedCue = {
      cueId: newItem.i,
      index: newItem.x,
      screen: newItem.y + 1,
    }

    if (cue) {
      movedCue.cueName = cue.name
      movedCue.color = cue.color
    }

    if (movedCue) {
      setStatus("loading")
      try {
        await dispatch(updatePresentation(id, movedCue))
        setCurrentLayout(newLayout)

        setTimeout(() => {
          setStatus("saved")
        }, 300)
      } catch (error) {
        console.error(error)

        // additional error handling for if something goes wrong with the API call to update the cue in database
        // revert the layout to the state that was before the error happened
        revertLayoutItem(newItem.i, oldItem)

        showToast({
          title: "Error updating position",
          description:
            "The element has been returned to its previous position.",
          status: "error",
        })
      }
    }
  }

  return (
    <GridLayout
      className="layout"
      layout={currentLayout}
      cols={indexCount}
      rowHeight={rowHeight}
      width={indexCount * columnWidth + (indexCount - 1) * gap}
      isDraggable={false}
      isResizable={false}
      resizeHandles={["e", "w"]}
      compactType={null}
      isBounded={false}
      preventCollision={true}
      margin={[gap, gap]}
      containerPadding={[0, 0]}
      useCSSTransforms={true}
      onDragStop={handlePositionChange}
      maxRows={Math.max(...cues.map((cue) => cue.screen), getAudioRow(screenCount))}
    >
      {cues.map((cue) => {
        const cueVisualSpan = getLayoutWidth(cue._id, getCueVisualDuration(cue))
        const hasContinuation = cueVisualSpan > 1
        const continuationSlotCount = Math.max(cueVisualSpan - 1, 0)
        const continuationInset = 0
        const continuationDividerWidth = gap > 2 ? 2 : Math.max(gap, 1)
        const continuationDividerOffset = Math.max((gap - continuationDividerWidth) / 2, 0)
        const continuationStartLeft = columnWidth
        const anchorContinuationDividerWidth = gap > 0
          ? Math.max(gap - continuationDividerOffset, continuationDividerWidth)
          : continuationDividerWidth
        const anchorContinuationSeamLeft = continuationStartLeft
        const continuationVisualOpacity = 0.76
        const segmentBorderColor = "rgba(255, 255, 255, 0.24)"
        const segmentBorderHoverColor = "rgba(255, 255, 255, 0.42)"
        const cueMediaUrl = cue.file?.url || (cue.file?.name ? `/${cue.file.name}` : "")
        const cueIsVideo = cue.file?.type?.startsWith("video/")
        const isVisualCue = cue.cueType === "visual"
        const isDraggingOriginCue = isDragging && draggingCueId === cue._id

        return (
          <div
            key={cue._id}
            data-testid={`cue-${cue.name}`}
            data-grid={{
              x: cue.index,
              y: cue.screen - 1,
              w: cueVisualSpan,
              h: 1,
              minH: 1,
              maxH: 1,
              minW: 1,
              static: false,
            }}
            id={`cue-screen-${cue.screen}-index-${cue.index}`}
          >
            <Box
              position="relative"
              h="100%"
              overflow="hidden"
              borderRadius="10px"
              cursor={isShowMode ? "default" : (isDragging ? "grabbing" : "grab")}
              data-cue-content-id={cue._id}
              opacity={isDraggingOriginCue ? 0.58 : 1}
              transform="translateY(0)"
              transition="opacity 90ms linear, transform 140ms ease, box-shadow 140ms ease"
              _hover={isDragging ? {} : { transform: "translateY(-1px)", boxShadow: "0 8px 18px rgba(0, 0, 0, 0.24)" }}
              sx={isDragging ? {} : {
                "&:hover [data-cue-anchor-border], &:hover [data-cue-continuation-border]": {
                  borderColor: segmentBorderHoverColor,
                },
                "&:hover [data-cue-seam-divider]": {
                  backgroundColor: segmentBorderHoverColor,
                },
                "&:hover [data-cue-anchor-hover-tint]": {
                  opacity: 0.18,
                },
              }}
            >
              {isShowMode
                ? (
                  ShowModeCueButtons(cue)
                )
                : (
                  !isDragging && EditModeCueButtons(cue)
                )}

              {hasContinuation && isVisualCue
                ? (
                  <Box
                    data-testid={`cue-anchor-media-overlay-${cue._id}`}
                    position="absolute"
                    left="0"
                    top="0"
                    width={`${columnWidth}px`}
                    height="100%"
                    borderRadius={hasContinuation ? "10px 0 0 10px" : "10px"}
                    overflow="hidden"
                    pointerEvents="none"
                    zIndex={4}
                    boxShadow={hasContinuation ? "inset 0 0 0 1px rgba(255, 255, 255, 0.14), 2px 6px 12px rgba(0, 0, 0, 0.18)" : "none"}
                  >
                    {cueMediaUrl
                      ? (
                        cueIsVideo
                          ? (
                            <video
                              src={cueMediaUrl}
                              draggable={false}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                  borderRadius: hasContinuation ? "10px 0 0 10px" : "10px",
                              }}
                              muted
                              playsInline
                              controls={false}
                            />
                          )
                          : (
                            <Box
                              as="img"
                              src={cueMediaUrl}
                              alt={cue.name}
                              draggable={false}
                              width="100%"
                              height="100%"
                              objectFit="cover"
                              borderRadius={hasContinuation ? "10px 0 0 10px" : "10px"}
                            />
                          )
                      )
                      : (
                        <Box
                          width="100%"
                          height="100%"
                          bg={cue.color || "#e014ee"}
                        />
                      )}
                  </Box>
                )
                : renderMedia(cue, cueIndex, cues, isShowMode, isAudioMuted, screenCount)}

              {hasContinuation && (
                <>
                  <Box
                    data-cue-anchor-hover-tint
                    position="absolute"
                    top={`${continuationInset}px`}
                    bottom={`${continuationInset}px`}
                    left="0"
                    width={`${columnWidth}px`}
                    bg="rgba(255, 255, 255, 0.2)"
                    opacity={0}
                    transition="opacity 140ms ease"
                    pointerEvents="none"
                    zIndex={5}
                  />

                  <Box
                    data-testid={`cue-continuation-overlay-${cue._id}`}
                    position="absolute"
                    top={`${continuationInset}px`}
                    bottom={`${continuationInset}px`}
                    left={`${continuationStartLeft}px`}
                    right="0"
                    borderRadius="0 8px 8px 0"
                    overflow="hidden"
                    opacity={continuationVisualOpacity}
                    pointerEvents="none"
                    zIndex={2}
                  >
                    {isVisualCue && cueMediaUrl
                      ? (
                        <>
                          {cueIsVideo
                            ? (
                              <video
                                src={cueMediaUrl}
                                draggable={false}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                  filter: "saturate(48%) brightness(0.8) contrast(0.94) blur(6px)",
                                }}
                                muted
                                playsInline
                                controls={false}
                              />
                            )
                            : (
                              <Box
                                as="img"
                                src={cueMediaUrl}
                                alt={`${cue.name} continuation`}
                                draggable={false}
                                width="100%"
                                height="100%"
                                objectFit="cover"
                                filter="saturate(48%) brightness(0.8) contrast(0.94) blur(6px)"
                              />
                            )}

                          <Box
                            position="absolute"
                            inset="0"
                            bg="linear-gradient(90deg, rgba(14, 20, 29, 0.1) 0%, rgba(14, 20, 29, 0.22) 50%, rgba(14, 20, 29, 0.5) 100%)"
                          />
                        </>
                      )
                      : (
                        <>
                          <Box
                            width="100%"
                            height="100%"
                            bg={cue.color || "rgba(20, 24, 33, 0.72)"}
                            filter="saturate(50%) brightness(0.88)"
                          />
                          <Box
                            position="absolute"
                            inset="0"
                            bg="linear-gradient(90deg, rgba(255, 255, 255, 0.16) 0%, rgba(176, 193, 223, 0.12) 35%, rgba(14, 20, 29, 0.32) 100%)"
                          />
                        </>
                      )}
                  </Box>

                  <Box
                    data-cue-anchor-border
                    position="absolute"
                    top={`${continuationInset}px`}
                    bottom={`${continuationInset}px`}
                    left="0"
                    width={`${columnWidth}px`}
                    border="1px solid"
                    borderColor={segmentBorderColor}
                    borderRightWidth="0"
                    borderRadius="10px 0 0 10px"
                    transition="border-color 140ms ease"
                    pointerEvents="none"
                    zIndex={6}
                  />

                  <Box
                    data-cue-continuation-border
                    position="absolute"
                    top={`${continuationInset}px`}
                    bottom={`${continuationInset}px`}
                    left={`${continuationStartLeft}px`}
                    right="0"
                    border="1px solid"
                    borderColor={segmentBorderColor}
                    borderLeftWidth="0"
                    borderRadius="0 8px 8px 0"
                    transition="border-color 140ms ease"
                    pointerEvents="none"
                    zIndex={6}
                  />

                  <Box
                    data-cue-seam-divider
                    position="absolute"
                    top={`${continuationInset}px`}
                    bottom={`${continuationInset}px`}
                    left={`${anchorContinuationSeamLeft}px`}
                    width={`${anchorContinuationDividerWidth}px`}
                    bg={segmentBorderColor}
                    transition="background-color 140ms ease"
                    pointerEvents="none"
                    zIndex={6}
                  />

                  {gap > 0 && continuationSlotCount > 1 && (
                    Array.from({ length: continuationSlotCount - 1 }).map((_, dividerIndex) => {
                      const dividerLeft = continuationStartLeft + (dividerIndex + 1) * (columnWidth + gap) + continuationDividerOffset
                      return (
                        <Box
                          key={`${cue._id}-continuation-divider-${dividerIndex}`}
                          data-testid={`cue-continuation-divider-${cue._id}-${dividerIndex}`}
                          position="absolute"
                          top={`${continuationInset}px`}
                          bottom={`${continuationInset}px`}
                          left={`${dividerLeft}px`}
                          width={`${continuationDividerWidth}px`}
                          bg="linear-gradient(180deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.08) 100%)"
                          pointerEvents="none"
                          zIndex={3}
                        />
                      )
                    })
                  )}
                </>
              )}

              {isDraggingOriginCue && (
                <Box
                  data-testid={`cue-drag-origin-indicator-${cue._id}`}
                  position="absolute"
                  left="0"
                  top="0"
                  width={`${columnWidth}px`}
                  height="100%"
                  border="2px dashed"
                  borderColor="#c9b7f8"
                  borderRadius="10px"
                  bg="rgba(201, 183, 248, 0.16)"
                  boxShadow="none"
                  pointerEvents="none"
                  zIndex={8}
                />
              )}

              {cue.name?.trim() && (
                <Tooltip label={cue.name} placement="top" hasArrow isDisabled={!isShowMode || isDragging}>
                  <Text
                    data-testid={`cue-label-${cue._id}`}
                    position="absolute"
                    top="50%"
                    left="8px"
                    transform="translateY(-50%)"
                    color="white"
                    fontWeight="bold"
                    bg="rgba(0, 0, 0, 0.5)"
                    p={2}
                    borderRadius="md"
                    whiteSpace="nowrap"
                    overflow="hidden"
                    textOverflow="ellipsis"
                    display="inline-block"
                    maxWidth={`${Math.max(columnWidth - 16, 40)}px`}
                    textAlign="left"
                    cursor="default"
                    pointerEvents="none"
                    userSelect="none"
                    zIndex={7}
                    style={{ textShadow: "2px 2px 4px rgb(0, 0, 0)" }}
                  >
                    {cue.name}
                  </Text>
                </Tooltip>
              )}
            </Box>
            <Dialog
              isOpen={isDialogOpen}
              onClose={() => setIsDialogOpen(false)}
              onConfirm={handleConfirmRemove}
              message="Are you sure you want to remove this element?"
            />
          </div>
        )
      })}
    </GridLayout>
  )
}

export default GridLayoutComponent
