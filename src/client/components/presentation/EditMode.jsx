import React, { useState, useRef, useCallback, useEffect } from "react"
import { Box, Text, ChakraProvider, extendTheme } from "@chakra-ui/react"
import "react-grid-layout/css/styles.css"
import "react-resizable/css/styles.css"
import { useDispatch } from "react-redux"
import {
  updatePresentation,
  createCue,
  removeCue,
} from "../../redux/presentationReducer"
import { createFormData } from "../utils/formDataUtils"
import ToolBox from "./ToolBox"
import GridLayoutComponent from "./GridLayoutComponent"
import StatusTooltip from "./StatusToolTip"
import Dialog from "../utils/AlertDialog"
import { useCustomToast } from "../utils/toastUtils"

const theme = extendTheme({})

const EditMode = ({ id, cues, isToolboxOpen, setIsToolboxOpen }) => {
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

  const xLabels = Array.from({ length: 101 }, (_, index) => `Index ${index}`)
  const maxScreen = Math.max(...cues.map((cue) => cue.screen), 4)
  const yLabels = Array.from(
    { length: maxScreen },
    (_, index) => `Screen ${index + 1}`
  )

  const [isDragging, setIsDragging] = useState(false)
  const clickTimeout = useRef(null)

  useEffect(() => {
    if (!isToolboxOpen) {
      setSelectedCue(null)
    }
  }, [isToolboxOpen])

  const handleMouseDown = (event) => {
    if (event.target.closest(".react-grid-item")) {
      setIsDragging(true)
      setHoverPosition(null)
    } else {
      setIsDragging(false)
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
      yIndex <= 4 &&
      yIndex >= 1
    ) {
      setHoverPosition({ index: xIndex, screen: yIndex })
    } else {
      setHoverPosition(null)
    }
  }

  const handleMouseUp = (event) => {
    setIsDragging(false)
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

  const columnWidth = 150
  const rowHeight = 100
  const gap = 10

  const addCue = async (cueData) => {
    const { index, cueName, screen, file, fileName } = cueData

    //Check if cue with same index and screen already exists
    const cueExists = cues.find(
      (cue) => cue.index === Number(index) && cue.screen === Number(screen)
    )
    if (cueExists) {
      setConfirmMessage(
        `Index ${index} element already exists on screen ${screen}. Do you want to replace it?`
      )
      setConfirmAction(() => async () => {
        const updatedCue = {
          ...cueExists,
          index,
          cueName,
          screen,
          file,
          fileName,
        }
        await dispatchUpdateCue(cueExists._id, updatedCue)
        setIsConfirmOpen(false)
      })
      setIsConfirmOpen(true)
      return
    }

    const formData = createFormData(
      index,
      cueName,
      screen,
      file || "/blank.png"
    )

    try {
      await dispatch(createCue(id, formData))
      showToast({
        title: "Element added",
        description: `Element ${cueName} added to screen ${screen}`,
        status: "success",
      })
    } catch (error) {
      const errorMessage = error.message
      showToast({
        title: "Error",
        description: errorMessage,
        status: "error",
      })
    }
  }

  const fetchFileFromUrl = async (url, fileName) => {
    const response = await fetch(url)
    const blob = await response.blob()
    return new File([blob], fileName, { type: blob.type })
  }

  const updateCue = async (cueId, updatedCue) => {
    const cueExists = cues.find(
      (cue) =>
        cue.index === Number(updatedCue.index) &&
        cue.screen === Number(updatedCue.screen)
    )

    if (cueExists && cueExists._id !== cueId) {
      setConfirmMessage(
        `Index ${updatedCue.index} element already exists on screen ${updatedCue.screen}. Do you want to replace it?`
      )
      setConfirmAction(() => async () => {
        const updatedDataCue = {
          ...cueExists,
          index: updatedCue.index,
          cueName: updatedCue.cueName,
          screen: updatedCue.screen,
          file: await fetchFileFromUrl(
            updatedCue.file.url,
            updatedCue.file.name
          ),
        }
        await dispatch(removeCue(id, cueId))
        await dispatchUpdateCue(cueExists._id, updatedDataCue)

        setIsConfirmOpen(false)
      })
      setIsConfirmOpen(true)
      return
    }
    await dispatchUpdateCue(cueId, updatedCue)
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

    // Stop if cue screen is not within valid range
    if (yIndex < 1 || yIndex > 4) {
      return
    }

    // Stop if cue index is not within valid range
    if (xIndex < 1 || xIndex > 100) {
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

  const handleDrop = useCallback(
    async (event) => {
      event.preventDefault()
      const files = Array.from(event.dataTransfer.files)
      const mediaFiles = files.filter(
        (file) =>
          file.type.startsWith("image/") || file.type.startsWith("video/")
      )

      if (mediaFiles.length > 0 && containerRef.current) {
        const { xIndex, yIndex } = getPosition(
          event,
          containerRef,
          columnWidth,
          rowHeight,
          gap
        )
        if (cueExists(xIndex, yIndex)) {
          setConfirmMessage(
            `Index ${xIndex} element already exists on screen ${yIndex}. Do you want to replace it?`
          )
          setConfirmAction(() => async () => {
            const existingCue = cues.find(
              (cue) => cue.index === xIndex && cue.screen === yIndex
            )
            const updatedCue = {
              ...existingCue,
              index: xIndex,
              cueName: mediaFiles[0].name,
              screen: yIndex,
              file: mediaFiles[0],
            }
            await dispatchUpdateCue(existingCue._id, updatedCue)
            setIsConfirmOpen(false)
          })
          setIsConfirmOpen(true)
          return
        }

        const file = mediaFiles[0]
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
          height="600px"
          width="100%"
          marginTop={`${gap * 2}px`}
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
                bg="purple.200"
                borderRadius="md"
                marginRight={`${gap}px`}
                h={`${rowHeight}px`}
                width={`${columnWidth}px`}
              >
                <Text fontWeight="bold" color="black">
                  {label}
                </Text>
              </Box>
            ))}
          </Box>

          <Box position="relative" overflow="auto">
            <Box
              height="600px"
              width="100%"
              position="relative"
              ref={containerRef}
              onDoubleClick={handleDoubleClick}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
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
                    bg="gray.200"
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
                id={id}
              />

              {hoverPosition && !isDragging && (
                <Box
                  position="absolute"
                  left={`${hoverPosition.index * (columnWidth + gap)}px`}
                  top={`${hoverPosition.screen * (rowHeight + gap)}px`}
                  width={`${columnWidth}px`}
                  height={`${rowHeight}px`}
                  bg="rgba(72, 26, 35, 0.8)"
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
