import React, { useState } from "react"
import { Box, IconButton, Tooltip, Text } from "@chakra-ui/react" // Ensure Text is imported
import {
  DeleteIcon,
  CopyIcon,
  RepeatIcon,
  ArrowForwardIcon,
} from "@chakra-ui/icons"
import GridLayout from "react-grid-layout"
import "react-grid-layout/css/styles.css"
import { useDispatch } from "react-redux"
import { updatePresentation, removeCue } from "../../redux/presentationReducer"
import { useCustomToast } from "../utils/toastUtils"
import Dialog from "../utils/AlertDialog"

const renderElementBasedOnIndex = (currentIndex, cues, cue) => {
  if (cue.index > currentIndex) {
    return false
  } else if (cue.index === currentIndex) {
    return true
  } else if (cue.index < currentIndex) {
    const audioElementIndexes = cues
      .filter((c) => c.screen === 5)
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

const renderMedia = (cue, cueIndex, cues, isShowMode, isAudioMuted) => {
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
    return (
      <img // Thumbail for image
        src={cue.file.url}
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
    cue.file.type.startsWith("audio/") &&
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
}) => {
  const showToast = useCustomToast()
  const dispatch = useDispatch()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [cueToRemove, setCueToRemove] = useState(null)

  const handleLoopToggle = async (cue) => {
    const updatedCue = {
      cueId: cue._id,
      cueName: cue.name,
      index: cue.index,
      screen: cue.screen,
      file: cue.file,
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

  /**
   * Do not remove the `layout` parameter from the `handlePositionChange` function.
   * It is required for the function to work correctly.
   */
  const handlePositionChange = async (layout, oldItem, newItem) => {
    if (oldItem.x === newItem.x && oldItem.y === newItem.y) {
      return
    }
    // y is 4 because screen 1 is 0 in y axis.
    if (oldItem.y === 4 || newItem.y === 4) {
      if (!(oldItem.y === 4 && newItem.y === 4)) {
        showToast({
          title: "Cannot move audio files to or from the audio row",
          description: "Audio files are only meant to be in the audio row.",
          status: "error",
        })
        return
      }
    }
    const movedCue = {
      cueId: newItem.i,
      index: newItem.x,
      screen: newItem.y + 1,
    }
    const cue = cues.find((cue) => cue._id === newItem.i)
    if (cue) {
      movedCue.cueName = cue.name
    }

    if (movedCue) {
      setStatus("loading")
      try {
        await dispatch(updatePresentation(id, movedCue))
        setTimeout(() => {
          setStatus("saved")
        }, 300)
      } catch (error) {
        console.error(error)
      }
    }
  }

  return (
    <GridLayout
      className="layout"
      layout={layout}
      cols={101}
      rowHeight={rowHeight}
      width={101 * columnWidth + (101 - 1) * gap}
      isResizable={false}
      compactType={null}
      isBounded={false}
      preventCollision={true}
      margin={[gap, gap]}
      containerPadding={[0, 0]}
      useCSSTransforms={true}
      onDragStop={handlePositionChange}
      maxRows={Math.max(...cues.map((cue) => cue.screen), 5)}
    >
      {cues.map((cue) => (
        <div
          key={cue._id}
          data-testid={`cue-${cue.name}`}
          data-grid={{
            x: cue.index,
            y: cue.screen - 1,
            w: 1,
            h: 1,
            static: false,
          }}
        >
          <Box position="relative" h="100%">
            {!isShowMode && (
              <>
                <IconButton
                  icon={<DeleteIcon />}
                  size="xs"
                  position="absolute"
                  _hover={{ bg: "red.500", color: "white" }}
                  backgroundColor="red.300"
                  draggable={false}
                  zIndex="10"
                  top="0px"
                  right="0px"
                  aria-label={`Delete ${cue.name}`}
                  title="Delete element"
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    handleRemoveItem(cue._id)
                  }}
                />
                <IconButton
                  icon={<CopyIcon />}
                  size="xs"
                  position="absolute"
                  _hover={{ bg: "gray.600", color: "white" }}
                  backgroundColor="gray.500"
                  draggable={false}
                  zIndex="10"
                  top="25px"
                  right="0px"
                  aria-label={`Copy ${cue.name}`}
                  title="Copy element"
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    setIsCopied(true)
                    setCopiedCue(cue)
                    showToast({
                      title: `Element ${cue.name} copied`,
                      description:
                        "Click on available places on the grid to paste. Click outside the grid to cancel",
                      status: "success",
                    })
                  }}
                />
                {cue.file.type.startsWith("audio/") && (
                  <IconButton
                    icon={cue.loop ? <RepeatIcon /> : <ArrowForwardIcon />}
                    size="xs"
                    position="absolute"
                    _hover={{ bg: "gray.600", color: "white" }}
                    backgroundColor="gray.500"
                    draggable={false}
                    zIndex="10"
                    top="50px"
                    right="0px"
                    aria-label={`Loop audio ${cue.name}`}
                    title={cue.loop ? "Disable loop" : "Enable loop"}
                    onMouseDown={(e) => {
                      e.stopPropagation()
                      handleLoopToggle(cue)
                    }}
                  />
                )}
              </>
            )}

            {renderMedia(cue, cueIndex, cues, isShowMode, isAudioMuted)}

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
                style={{ textShadow: "2px 2px 4px rgba(0,0,0,1)" }}
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
