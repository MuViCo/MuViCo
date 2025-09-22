import React, { useState, useRef, useCallback, useEffect } from "react"
import {
  Box,
  Text,
  ChakraProvider,
  extendTheme,
  useOutsideClick,
  useColorModeValue,
  IconButton,
} from "@chakra-ui/react"
import "react-grid-layout/css/styles.css"
import { useDispatch } from "react-redux"
import {
  updatePresentation,
  createCue,
  removeCue,
  updatePresentationSwappedCues,
} from "../../redux/presentationReducer"
import { createFormData } from "../utils/formDataUtils"
import ToolBox from "./ToolBox"
import GridLayoutComponent from "./GridLayoutComponent"
import StatusTooltip from "./StatusToolTip"
import Dialog from "../utils/AlertDialog"
import { useCustomToast } from "../utils/toastUtils"
import { SpeakerIcon, SpeakerMutedIcon } from "../../lib/icons"

const theme = extendTheme({})

const EditMode = ({
  id,
  cues,
  isToolboxOpen,
  setIsToolboxOpen,
  isShowMode,
  cueIndex,
  isAudioMuted,
  toggleAudioMute,
}) => {
  const bgColorHover = useColorModeValue(
    "rgba(255, 181, 181, 0.8)",
    "rgba(72, 26, 35, 0.8)"
  )
  const bgColorIndex = useColorModeValue("rgb(240, 197, 255)", "gray.200")
  const showToast = useCustomToast()
  const dispatch = useDispatch()
  const containerRef = useRef(null)

  const [status, setStatus] = useState("saved")
  const [selectedCue, setSelectedCue] = useState(null)

  const [doubleClickPosition, setDoubleClickPosition] = useState({
    xIndex: 0,
    yIndex: 0,
  })
  const [hoverPosition, setHoverPosition] = useState(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [confirmMessage, setConfirmMessage] = useState("")
  const [confirmAction, setConfirmAction] = useState(() => () => {})

  const xLabels = Array.from({ length: 101 }, (_, index) => 
    index === 0 ? "Starting Frame" : `Frame ${index}`)
  const maxScreen = Math.max(...cues.map((cue) => cue.screen), 4)
  const yLabels = Array.from(
    { length: maxScreen },
    (_, index) => `Screen ${index + 1}`
  )

  yLabels[4] = "Audio files"

  const [isDragging, setIsDragging] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [copiedCue, setCopiedCue] = useState(null)
  useOutsideClick({
    ref: containerRef,
    handler: () => {
      if (isCopied) {
        showToast({
          title: "Cancelled copying",
          description: "Copying element has been cancelled.",
          status: "info",
        })
      }
      setIsCopied(false)
      setCopiedCue(null)
    },
  })

  const clickTimeout = useRef(null)

  const columnWidth = 150
  const rowHeight = 100
  const gap = 10

  useEffect(() => {
    if (!isToolboxOpen) {
      setSelectedCue(null)
    }
  }, [isToolboxOpen])

  const handleMouseDown = (event) => {
    const { xIndex, yIndex } = getPosition(
      event,
      containerRef,
      columnWidth,
      rowHeight,
      gap
    )

    if (cueExists(xIndex, yIndex)) {
      const movingCue = cues.find(
        (cue) => cue.index === xIndex && cue.screen === yIndex
      )
      setSelectedCue(movingCue)

      if (event.target.closest(".react-grid-item")) {
        setIsDragging(true)
        setHoverPosition(null)
      } else {
        setIsDragging(false)
      }
    }
  }

  const handlePaste = async (event) => {
    if (!isCopied || !copiedCue) return

    if (!containerRef?.current) {
      console.error("Container ref is not available")
      return
    }

    const { xIndex, yIndex } = getPosition(
      event,
      containerRef,
      columnWidth,
      rowHeight,
      gap
    )

    if (xIndex === copiedCue.index && yIndex === copiedCue.screen) {
      return
    } else if (
      (yIndex === 5 && copiedCue.screen !== 5) ||
      (copiedCue.screen === 5 && yIndex !== 5)
    ) {
      showToast({
        title: "Only audio files on the audio row.",
        description: "Click on an appropriate row to paste the element.",
        status: "error",
      })
      return
    }

    const newCueData = await createNewCueData(xIndex, yIndex, copiedCue)
    await addCue(newCueData)
    setIsCopied(false)
    setCopiedCue(null)
  }

  const createNewCueData = async (xIndex, yIndex, copiedCue) => {
    const fileObj = await fetchFileFromUrl(
      copiedCue.file.url,
      copiedCue.file.name
    )

    if (copiedCue.file.driveId) {
      fileObj.driveId = copiedCue.file.driveId
    }

    return {
      index: xIndex,
      cueName: `${copiedCue.name} copy`,
      screen: yIndex,
      file: fileObj,
      fileName: copiedCue.file.name || "blank.png",
    }
  }

  const handleMouseMove = (event) => {
    if (isDragging) return
    if (event.target.closest(".x-index-label")) {
      return
    }
    const { xIndex, yIndex } = getPosition(
      event,
      containerRef,
      columnWidth,
      rowHeight,
      gap
    )

    const cueExists = cues.some(
      (cue) => cue.index === xIndex && cue.screen === yIndex
    )

    if (
      !cueExists &&
      xIndex >= 0 &&
      xIndex <= 101 &&
      yIndex <= 5 &&
      yIndex >= 1
    ) {
      setHoverPosition({ index: xIndex, screen: yIndex })
    } else {
      setHoverPosition(null)
    }
  }

  const handleMouseUp = (event) => {
    setIsDragging(false)
    const { xIndex, yIndex } = getPosition(
      event,
      containerRef,
      columnWidth,
      rowHeight,
      gap
    )

    if (cueExists(xIndex, yIndex) && isDragging) {
      const targetCue = cues.find(
        (cue) => cue.index === xIndex && cue.screen === yIndex
      )
      if (selectedCue && targetCue && selectedCue !== targetCue) {
        handleElementPositionChange(selectedCue, targetCue)
      }
    }

    if (!isDragging) {
      if (clickTimeout.current) {
        clearTimeout(clickTimeout.current)
        clickTimeout.current = null
        handleDoubleClick(event)
      } else {
        clickTimeout.current = setTimeout(() => {
          clickTimeout.current = null
        }, 300)
      }
    }
  }

  const layout = cues.map((cue) => {
    const position = {
      i: cue._id.toString(),
      x: cue.index,
      y: cue.screen,
      w: 1,
      h: 1,
      static: false,
    }
    return position
  })

  const addCue = async (cueData) => {
    setStatus("loading")
    const { index, cueName, screen, file, loop } = cueData

    //Check if cue with same index and screen already exists
    const existingCue = cues.find(
      (cue) => cue.index === Number(index) && cue.screen === Number(screen)
    )

    if (existingCue) {
      await handleCueExists(existingCue, cueData)
      return
    }

    const formData = createFormData(
      index,
      cueName,
      screen,
      file || "/blank.png",
      loop || false
    )

    try {
      await dispatch(createCue(id, formData))

      setTimeout(() => {
        setStatus("saved")
        showToast({
          title: "Element added",
          description: `Element ${cueName} added to screen ${screen}`,
          status: "success",
        })
      }, 300)
    } catch (error) {
      const errorMessage = error.message
      showToast({ title: "Error", description: errorMessage, status: "error" })
    }
  }

  const handleCueExists = async (existingCue, newCueData) => {
    setConfirmMessage(
      `Index ${newCueData.index} element already exists on screen ${newCueData.screen}. Do you want to replace it?`
    )
    setConfirmAction(() => async () => {
      const updatedCue = { ...existingCue, ...newCueData }
      await dispatchUpdateCue(existingCue._id, updatedCue)
      setIsConfirmOpen(false)
    })
    setIsConfirmOpen(true)
  }

  const fetchFileFromUrl = async (url, fileName) => {
    const response = await fetch(url)
    const blob = await response.blob()
    return new File([blob], fileName, { type: blob.type })
  }

  const updateCue = async (previousCueId, updatedCue) => {
    const existingCue = cues.find(
      (cue) =>
        cue.index === Number(updatedCue.index) &&
        cue.screen === Number(updatedCue.screen)
    )

    if (existingCue && existingCue._id !== previousCueId) {
      await handleExistingCueUpdate(existingCue, updatedCue, previousCueId)
      return
    }
    await dispatchUpdateCue(previousCueId, updatedCue)
  }

  const handleExistingCueUpdate = async (
    existingCue,
    updatedCue,
    previousCueId
  ) => {
    setConfirmMessage(
      `${updatedCue.index} element already exists on screen ${updatedCue.screen}. Do you want to replace it?`
    )

    setConfirmAction(() => async () => {
      const updatedCueData = await createUpdatedCueData(existingCue, updatedCue)
      await dispatch(removeCue(id, previousCueId))
      await dispatchUpdateCue(existingCue._id, updatedCueData)
      setIsConfirmOpen(false)
    })
    setIsConfirmOpen(true)
  }

  const createUpdatedCueData = async (existingCue, updatedCue) => {
    const fileObj = await fetchFileFromUrl(
      updatedCue.file.url,
      updatedCue.file.name
    )

    if (updatedCue.file.driveId) {
      fileObj.driveId = updatedCue.file.driveId
    }

    return {
      ...existingCue,
      index: updatedCue.index,
      cueName: updatedCue.cueName,
      screen: updatedCue.screen,
      file: fileObj,
      fileName: updatedCue.fileName,
    }
  }

  const cueExists = (xIndex, yIndex) => {
    return cues.some(
      (cue) =>
        Number(cue.index) === Number(xIndex) &&
        Number(cue.screen) === Number(yIndex)
    )
  }

  const handleDoubleClick = (event) => {
    if (event.target.closest(".x-index-label")) {
      return
    }

    const { xIndex, yIndex } = getPosition(
      event,
      containerRef,
      columnWidth,
      rowHeight,
      gap
    )

    if (yIndex < 1 || yIndex > 5) {
      return
    }

    if (xIndex < 0 || xIndex > 100) {
      return
    }

    const cue = cues.find(
      (cue) => cue.index === xIndex && cue.screen === yIndex
    )

    if (cue) {
      setSelectedCue(cue)
      setIsToolboxOpen(true)
    } else {
      setDoubleClickPosition({ index: xIndex, screen: yIndex })
      setIsToolboxOpen(true)
    }
  }

  const dispatchUpdateCue = async (cueId, updatedCue) => {
    setStatus("loading")
    try {
      await dispatch(updatePresentation(id, updatedCue, cueId))
      setTimeout(() => {
        setStatus("saved")
        showToast({
          title: "Element updated",
          description: `Element ${updatedCue.cueName} updated on screen ${updatedCue.screen}`,
          status: "success",
        })
      }, 300)
    } catch (error) {
      console.error(error)
      showToast({
        title: "Error",
        description: error.message || "An error occurred",
        status: "error",
      })
    }
  }

  const dispatchUpdateSwappedCues = async (newTargetCue, newSelectedCue) => {
    setStatus("loading")
    try {
      await dispatch(
        updatePresentationSwappedCues(id, newTargetCue, newSelectedCue)
      )
      setStatus("saved")
    } catch (error) {
      console.error(error)
      showToast({
        title: "Error",
        description: error.message || "An error occurred",
        status: "error",
      })
    }
  }

  const getPosition = (event, containerRef, columnWidth, rowHeight, gap) => {
    const dropX = event.clientX
    const containerRect = containerRef.current.getBoundingClientRect()
    const containerScrollLeft = containerRef.current.scrollLeft

    const relativeDropX = dropX - containerRect.left
    const absoluteDropX = relativeDropX + containerScrollLeft
    const dropY = event.clientY - containerRect.top

    const cellWidthWithGap = columnWidth + gap
    const cellHeightWithGap = rowHeight + gap

    const yIndex = Math.floor(dropY / cellHeightWithGap)
    const xIndex = Math.floor(absoluteDropX / cellWidthWithGap)

    return { xIndex, yIndex }
  }

  const handleElementPositionChange = async (selectedCue, targetCue) => {
    const newTargetCue = {
      ...targetCue,
      index: selectedCue.index,
      screen: selectedCue.screen,
    }

    const newSelectedCue = {
      ...selectedCue,
      index: targetCue.index,
      screen: targetCue.screen,
    }

    if (newTargetCue.screen === 5 || newSelectedCue.screen === 5) {
      if (!(newTargetCue.screen === 5 && newSelectedCue.screen === 5)) {
        showToast({
          title: "Error",
          description: "You cannot swap elements with audio files",
          status: "error",
        })
        setSelectedCue(null)
        return
      } else {
        await dispatchUpdateSwappedCues(newTargetCue, newSelectedCue)
        setSelectedCue(null)
      }
    } else {
      await dispatchUpdateSwappedCues(newTargetCue, newSelectedCue)
      setSelectedCue(null)
    }
  }

  const isImageOrVideo = (file) =>
    file.type.startsWith("image/") || file.type.startsWith("video/")
  const isAudio = (file) => file.type.startsWith("audio/")

  const handleCueReplace = async (xIndex, yIndex, file) => {
    const existingCue = cues.find(
      (cue) => cue.index === xIndex && cue.screen === yIndex
    )
    if (!existingCue) return

    const updatedCue = {
      ...existingCue,
      index: xIndex,
      cueName: file.name,
      screen: yIndex,
      file: file,
    }

    await dispatchUpdateCue(existingCue._id, updatedCue)
    setIsConfirmOpen(false)
  }

  const handleDrop = useCallback(
    async (event) => {
      event.preventDefault()

      if (isShowMode) {
        return
      }
      const files = Array.from(event.dataTransfer.files)
      const mediaFiles = files.filter(
        (file) => isImageOrVideo(file) || isAudio(file)
      )

      if (mediaFiles.length === 0 || !containerRef.current) {
        return
      }

      const { xIndex, yIndex } = getPosition(
        event,
        containerRef,
        columnWidth,
        rowHeight,
        gap
      )

      const file = mediaFiles[0]

      if (isImageOrVideo(file) && xIndex < 101 && yIndex > 4) {
        showToast({
          title: "Only audio files on the audio row.",
          description: "Click on an appropriate row to paste the element.",
          status: "error",
        })
        return
      }
      if (isAudio(file) && yIndex !== 5 && xIndex < 101) {
        showToast({
          title: "Only images/videos on screen rows.",
          description: "Click on an appropriate row to paste the element.",
          status: "error",
        })
        return
      }

      if (cueExists(xIndex, yIndex)) {
        setConfirmMessage(
          `Index ${xIndex} element already exists on screen ${yIndex}. Do you want to replace it?`
        )
        setConfirmAction(() => async () => {
          handleCueReplace(xIndex, yIndex, file)
        })
        setIsConfirmOpen(true)
        return
      }
      const formData = createFormData(xIndex, file.name, yIndex, file)

      try {
        await dispatch(createCue(id, formData))
        showToast({
          title: "Element added",
          description: `Element ${file.name} added to screen ${yIndex}`,
          status: "success",
        })
      } catch (error) {
        const errorMessage = error.message || "An error occurred"
        showToast({
          title: "Error",
          description: errorMessage,
          status: "error",
        })
      }
    },
    [dispatch, gap, rowHeight, columnWidth, id, cues]
  )

  return (
    <ChakraProvider theme={theme}>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        data-testid="drop-area"
      >
        <Box
          display="flex"
          height="680px"
          width="100%"
          marginTop={`${gap * 2}px`}
          overflow="auto"
        >
          <Box
            display="grid"
            gridTemplateRows={`repeat(${yLabels.length + 1}, ${rowHeight}px)`}
            gap={`${gap}px`}
            left={0}
            zIndex={2}
            bg={"transparent"}
          >
            <Box h={`${rowHeight}px`} bg="transparent" />

            {yLabels.map((label) => (
              <Box
                key={label}
                display="flex"
                alignItems="center"
                justifyContent="center"
                bg={
                  label === "Audio files" ? "rgb(204, 46, 252)" : "purple.200"
                }
                borderRadius="md"
                marginRight={`${gap}px`}
                h={`${rowHeight}px`}
                width={`${columnWidth}px`}
                position="relative"
              >
                <Text fontWeight="bold" color="black">
                  {label}
                </Text>
                {label === "Audio files" && (
                  <IconButton
                    icon={
                      isAudioMuted ? (
                        <SpeakerMutedIcon boxSize="32px" />
                      ) : (
                        <SpeakerIcon boxSize="32px" />
                      )
                    }
                    disabled={isShowMode}
                    _disabled={{
                      opacity: 0.7,
                      cursor: "not-allowed",
                    }}
                    sx={{
                      width: "48px",
                      height: "48px",
                      padding: "10px",
                    }}
                    _hover={{ color: "rgb(99, 76, 107)" }}
                    textColor={"black"}
                    variant="ghost"
                    draggable={false}
                    position="absolute"
                    zIndex="10"
                    top="0px"
                    right="0px"
                    aria-label="Mute/unmute audio"
                    title={isAudioMuted ? "Unmute audio" : "Mute audio"}
                    onMouseDown={(e) => {
                      e.stopPropagation()
                      toggleAudioMute()
                    }}
                  />
                )}
              </Box>
            ))}
          </Box>
          <Box position="relative" pointerEvents={isShowMode ? "none" : "auto"}>
            <Box
              height="600px"
              width="100%"
              position="relative"
              ref={containerRef}
              onDoubleClick={handleDoubleClick}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onClick={handlePaste}
            >
              <Box
                display="grid"
                gridTemplateColumns={`repeat(${xLabels.length}, ${columnWidth}px)`}
                gap={`${gap}px`}
                position="sticky"
                top={0}
                zIndex={1}
                bg={"transparent"}
                mb={`${gap}px`}
              >
                {xLabels.map((label) => (
                  <Box
                    key={label}
                    className="x-index-label"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    bg={bgColorIndex}
                    borderRadius="md"
                    h={`${rowHeight}px`}
                    width={`${columnWidth}px`}
                  >
                    <Text fontWeight="bold" color="black">
                      {label}
                    </Text>
                  </Box>
                ))}
              </Box>

              <GridLayoutComponent
                layout={layout}
                cues={cues}
                containerRef={containerRef}
                columnWidth={columnWidth}
                rowHeight={rowHeight}
                gap={gap}
                setStatus={setStatus}
                setIsCopied={setIsCopied}
                setCopiedCue={setCopiedCue}
                id={id}
                isShowMode={isShowMode}
                cueIndex={cueIndex}
                isAudioMuted={isAudioMuted}
              />

              {hoverPosition && !isDragging && (
                <Box
                  position="absolute"
                  left={`${hoverPosition.index * (columnWidth + gap)}px`}
                  top={`${hoverPosition.screen * (rowHeight + gap)}px`}
                  width={`${columnWidth}px`}
                  height={`${rowHeight}px`}
                  bg={bgColorHover}
                  borderRadius="16"
                  transition="0"
                  zIndex={-1}
                  pointerEvents="none"
                />
              )}
            </Box>
          </Box>

          <ToolBox
            isOpen={isToolboxOpen}
            onClose={() => setIsToolboxOpen(false)}
            position={doubleClickPosition}
            addCue={addCue}
            cues={cues}
            cueData={selectedCue || null}
            updateCue={updateCue}
          />
        </Box>
        <Box
          position="fixed"
          top="20%"
          right="5%"
          display="flex"
          alignItems="center"
          zIndex={1}
        ></Box>
        <Box
          position="fixed"
          top="11%"
          right="5%"
          display="flex"
          alignItems="center"
          zIndex={1}
        >
          <StatusTooltip status={status} />
        </Box>
        <Dialog
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          onConfirm={confirmAction}
          message={confirmMessage}
        />
      </div>
    </ChakraProvider>
  )
}

export default EditMode
