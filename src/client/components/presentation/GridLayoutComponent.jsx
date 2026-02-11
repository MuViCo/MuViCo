import React, { useState, useEffect } from "react"
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

const renderElementBasedOnIndex = (currentIndex, cues, cue, screenCount) => {
  if (cue.index > currentIndex) {
    return false
  } else if (cue.index === currentIndex) {
    return true
  } else if (cue.index < currentIndex) {
    const audioElementIndexes = cues
      .filter((c) => c.screen === screenCount + 1)
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
    cue.file.type.startsWith("audio/") &&
    renderElementBasedOnIndex(cueIndex, cues, cue, screenCount)
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
  const [currentLayout, setCurrentLayout] = useState(layout)

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
      {cue.file &&cue.file.type.startsWith("audio/") && (
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
            borderRadius={cue.file!=null ? (cue.file.type.startsWith("audio/") ? "0" : "0 0 0.375rem 0.375rem") : "0 0 0.375rem 0.375rem"}
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
          {cue.file!=null &&cue.file.type.startsWith("audio/") && (
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
    
    if (oldItem.y === screenCount || newItem.y === screenCount) {
      if (!(oldItem.y === screenCount && newItem.y === screenCount)) {
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
            }
          }
          return item
        })

        setCurrentLayout(updatedLayout)
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
        const revertedLayout = currentLayout.map((item) => {
          if (item.i === newItem.i) {
            return {
              ...item,
              x: oldItem.x,
              y: oldItem.y,
            }
          }
          return item
        })

        setCurrentLayout(revertedLayout)

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
      isResizable={false}
      compactType={null}
      isBounded={false}
      preventCollision={true}
      margin={[gap, gap]}
      containerPadding={[0, 0]}
      useCSSTransforms={true}
      onDragStop={handlePositionChange}
      maxRows={Math.max(...cues.map((cue) => cue.screen), screenCount + 1)}
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
