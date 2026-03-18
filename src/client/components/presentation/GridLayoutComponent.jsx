import React, { useState, useEffect, useMemo, useCallback } from "react"
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
import {
  DEFAULT_CUE_WIDTH_UNITS,
  buildCueCellMap,
  getCueWidthUnits,
} from "../utils/cueGridUtils"

const normalizeLayoutItem = (item) => {
  const cueWidthUnits = Number(item?.w)
  const normalizedCueWidthUnits = Number.isInteger(cueWidthUnits) && cueWidthUnits >= DEFAULT_CUE_WIDTH_UNITS
    ? cueWidthUnits
    : DEFAULT_CUE_WIDTH_UNITS

  return {
    ...item,
    w: normalizedCueWidthUnits,
    h: 1,
    minW: 1,
    minH: 1,
    maxH: 1,
  }
}

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
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          borderRadius: "10px",
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
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          borderRadius: "10px",
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
  screenCount
}) => {
  const showToast = useCustomToast()
  const dispatch = useDispatch()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [cueToRemove, setCueToRemove] = useState(null)
  const [currentLayout, setCurrentLayout] = useState(() => layout.map(normalizeLayoutItem))

  const cueById = useMemo(() => {
    return new Map(cues.map((cue) => [cue._id, cue]))
  }, [cues])

  const cueByGridCell = useMemo(() => {
    return buildCueCellMap(cues)
  }, [cues])

  const getCueAtGridCell = useCallback((x, y, excludedCueId = null) => {
    const cue = cueByGridCell.get(`${Number(x)}:${Number(y) + 1}`)
    if (!cue) {
      return null
    }

    if (excludedCueId && cue._id === excludedCueId) {
      return null
    }

    return cue
  }, [cueByGridCell])

  const isCueOnAllowedRow = useCallback((cueType, targetY) => {
    const audioRowYIndex = getAudioRow(screenCount) - 1
    const movingToAudioRow = Number(targetY) === audioRowYIndex
    const cueIsAudio = cueType === "audio"

    return (cueIsAudio && movingToAudioRow) || (!cueIsAudio && !movingToAudioRow)
  }, [screenCount])

  const revertCueLayoutPosition = useCallback((cueId, oldItem) => {
    setCurrentLayout((prevLayout) => prevLayout.map((item) => {
      if (item.i !== cueId) {
        return item
      }

      return {
        ...item,
        x: oldItem.x,
        y: oldItem.y,
        w: Math.max(DEFAULT_CUE_WIDTH_UNITS, Math.round(Number(oldItem.w) || DEFAULT_CUE_WIDTH_UNITS)),
        h: 1,
      }
    }))
  }, [])

  useEffect(() => {
    setCurrentLayout(layout.map(normalizeLayoutItem))
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
    <Menu>
      <MenuButton
        as={IconButton}
        aria-label='Options'
        icon={<ChevronDownIcon />}
        backgroundColor="var(--chakra-colors-gray-700)" 
        _hover={{ backgroundColor: "var(--chakra-colors-gray-600)" }}  
        _active={{ backgroundColor: "var(--chakra-colors-gray-600)" }} 
        variant='outline'
        position="absolute"
        zIndex="10"
        top="3px"
        right="3px"
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
    if (oldItem.x === newItem.x && oldItem.y === newItem.y) {
      return
    }

    const cue = cueById.get(newItem.i)
    if (!cue) {
      return
    }

    if (!isCueOnAllowedRow(cue.cueType, newItem.y)) {
      showToast({
        title: "Cannot move this file type here",
        description: "Keep audio elements to the audio row and visual elements to the visual rows.",
        status: "error",
      })

      revertCueLayoutPosition(newItem.i, oldItem)
      return
    }

    const targetCue = getCueAtGridCell(newItem.x, newItem.y, newItem.i)

    if (targetCue) {
      setCurrentLayout(newLayout.map(normalizeLayoutItem))
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
        setCurrentLayout(newLayout.map(normalizeLayoutItem))

        setTimeout(() => {
          setStatus("saved")
        }, 300)
      } catch (error) {
        console.error(error)

        // additional error handling for if something goes wrong with the API call to update the cue in database
        // revert the layout to the state that was before the error happened
        revertCueLayoutPosition(newItem.i, oldItem)

        showToast({
          title: "Error updating position",
          description:
            "The element has been returned to its previous position.",
          status: "error",
        })
      }
    }
  }

  const handleResizeStop = async (newLayout, oldItem, newItem) => {
    const cue = cueById.get(newItem.i)
    if (!cue) {
      return
    }

    const nextCueWidthUnits = Math.max(DEFAULT_CUE_WIDTH_UNITS, Math.round(Number(newItem.w) || DEFAULT_CUE_WIDTH_UNITS))
    const previousCueWidthUnits = getCueWidthUnits(cue)
    const positionDidNotChange = oldItem.x === newItem.x && oldItem.y === newItem.y

    if (positionDidNotChange && previousCueWidthUnits === nextCueWidthUnits) {
      return
    }

    if (!isCueOnAllowedRow(cue.cueType, newItem.y)) {
      showToast({
        title: "Cannot move this file type here",
        description: "Keep audio elements to the audio row and visual elements to the visual rows.",
        status: "error",
      })
      revertCueLayoutPosition(newItem.i, oldItem)
      return
    }

    const resizedCue = {
      cueId: newItem.i,
      index: newItem.x,
      screen: newItem.y + 1,
      cueWidth: nextCueWidthUnits,
      cueName: cue.name,
      color: cue.color,
    }

    setStatus("loading")
    try {
      await dispatch(updatePresentation(id, resizedCue))
      setCurrentLayout(newLayout.map(normalizeLayoutItem))
      setTimeout(() => {
        setStatus("saved")
      }, 300)
    } catch (error) {
      console.error(error)
      revertCueLayoutPosition(newItem.i, oldItem)
      showToast({
        title: "Error updating size",
        description: "The element has been returned to its previous size.",
        status: "error",
      })
    }
  }

  return (
    <GridLayout
      className="layout"
      layout={currentLayout}
      cols={indexCount}
      rowHeight={rowHeight}
      width={indexCount * columnWidth + (indexCount - 1) * gap}
      isResizable={!isShowMode}
      resizeHandles={["e", "w"]}
      compactType={null}
      isBounded={false}
      preventCollision={true}
      margin={[gap, gap]}
      containerPadding={[0, 0]}
      useCSSTransforms={true}
      onDragStop={handlePositionChange}
      onResizeStop={handleResizeStop}
      maxRows={Math.max(...cues.map((cue) => cue.screen), getAudioRow(screenCount))}
    >
      {cues.map((cue) => (
        <div
          key={cue._id}
          data-testid={`cue-${cue.name}`}
          data-grid={{
            x: cue.index,
            y: cue.screen - 1,
            w: getCueWidthUnits(cue),
            h: 1,
            minW: 1,
            minH: 1,
            maxH: 1,
            static: false,
          }}
          id={`cue-screen-${cue.screen}-index-${cue.index}`}
        >
          <Box position="relative" h="100%">
            {isShowMode
              ? (
                ShowModeCueButtons(cue)
              )
            : (
                EditModeCueButtons(cue)
            )}

            {renderMedia(cue, cueIndex, cues, isShowMode, isAudioMuted, screenCount)}

            <Tooltip label={cue.name} placement="top" hasArrow>
              <Text
                position="absolute"
                top="50%"
                left="50%"
                transform="translate(-50%, -50%)"
                color="white"
                fontWeight="bold"
                bg="rgba(0, 0, 0, 0.5)"
                p={2}
                borderRadius="md"
                whiteSpace="nowrap"
                overflow="hidden"
                textOverflow="ellipsis"
                display="inline-block"
                maxWidth="80%"
                textAlign="center"
                cursor="default"
                style={{ textShadow: "2px 2px 4px rgb(0, 0, 0)" }}
              >
                {cue.name}
              </Text>
            </Tooltip>
          </Box>
          <Dialog
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
            onConfirm={handleConfirmRemove}
            message="Are you sure you want to remove this element?"
          />
        </div>
      ))}
    </GridLayout>
  )
}

export default GridLayoutComponent
