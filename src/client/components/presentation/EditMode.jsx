import React, { useState, useRef, useCallback } from "react"
import { Box, Text, ChakraProvider, extendTheme, useColorModeValue, IconButton} from "@chakra-ui/react"
import { CloseIcon, CheckIcon } from "@chakra-ui/icons"
import { Spinner } from "@chakra-ui/react"
import { Tooltip } from "@chakra-ui/react"
import GridLayout from "react-grid-layout"
import "react-grid-layout/css/styles.css"
import "react-resizable/css/styles.css"
import { useDispatch } from "react-redux"
import { useToast } from "@chakra-ui/react"
import { removeCue, updatePresentation, createCue, fetchPresentationInfo } from "../../redux/presentationReducer"
import EditToolBox from "./EditToolBox"
import Toolbox from "./ToolBox"

const theme = extendTheme({})

const EditMode = ({ id, cues }) => {
  const toast = useToast()
  const dispatch = useDispatch()
  const containerRef = useRef(null)

  // for ui element
  const [status, setStatus] = useState("saved")

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isToolboxOpen, setIsToolboxOpen] = useState(false)
  const [selectedCue, setSelectedCue] = useState(null)

  const xLabels = Array.from({ length: 101 }, (_, index) => `Cue ${index}`)
  const maxScreen = Math.max(...cues.map(cue => cue.screen), 4)
  const yLabels = Array.from({ length: maxScreen }, (_, index) => `Screen ${index + 1}`)

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

  const handlePositionChange = async (layout, oldItem, newItem) => {

    if (oldItem.x === newItem.x && oldItem.y === newItem.y) {
      return
    }
    
    const movedCue = {
      cueId: newItem.i,
      cueIndex: newItem.x,
      screen: newItem.y + 1,
    }
    const cue = cues.find(cue => cue._id === newItem.i)
    if (cue) {
      movedCue.cueName = cue.name
    }
    
    if (movedCue) {
      setStatus("loading")
      try {
        await dispatch(updatePresentation(id, movedCue))
        setTimeout(() => {
          setStatus("saved")
          dispatch(fetchPresentationInfo(id))
        }, 300)
      } catch (error) {
        console.error(error) 
      }
    }
  }

  const cueExists = (xIndex, yIndex) => {
    return cues.some(cue => cue.index === xIndex && cue.screen === yIndex + 1)
  }

  const handleDoubleClick = (event) => {
    const { xIndex, yIndex } = getPosition(event, containerRef, columnWidth, rowHeight, gap)
    const cue = cues.find(cue => cue.index === xIndex && cue.screen === yIndex)
    if (cue) {
      setSelectedCue(cue)
      setIsEditOpen(true)
    } else {
      setIsToolboxOpen(true)
    }
  }

  const updateCue = async (cueId, updatedCue) => {
    setStatus("loading")
    try {
      await dispatch(updatePresentation(id, updatedCue))
      setTimeout(() => {
        setStatus("saved")
        dispatch(fetchPresentationInfo(id))
      }, 300)
    } catch (error) {
      console.error(error) 
    }
  }
  
  const handleRemoveItem = async (cueId) => {
    if (!window.confirm("Are you sure you want to delete this element?")) return

    try {
      await dispatch(removeCue(id, cueId))
      toast({
        title: "Element removed",
        description: `Element with ID ${cueId} has been removed.`,
        status: "success",
        position: "top",
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      console.error(error)
      const errorMessage = error.message || "An error occurred"
      toast({
        title: "Error",
        description: errorMessage,
        status: "error",
        position: "top",
        duration: 3000,
        isClosable: true,
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


  const handleDrop = useCallback(async (event) => {
    event.preventDefault()
    const files = Array.from(event.dataTransfer.files)
    const imageFiles = files.filter((file) => file.type.startsWith("image/"))

    if (imageFiles.length > 0 && containerRef.current) {
      const { xIndex, yIndex } = getPosition(event, containerRef, columnWidth, rowHeight, gap)

      if (cueExists(xIndex, yIndex)) {
        toast({
          title: "Element already exists",
          description: `Element with index ${xIndex} already exists on screen ${yIndex}`,
          status: "error",
          position: "top",
          duration: 3000,
          isClosable: true,
        })
        return
      }

      const file = imageFiles[0]
      const formData = new FormData()
      formData.append("index", xIndex)
      formData.append("cueName", file.name)
      formData.append("screen", yIndex)
      formData.append("image", file)

      try {
        await dispatch(createCue(id, formData))
        await dispatch(fetchPresentationInfo(id))
        toast({
          title: "Element added",
          description: `Element ${file.name} added to screen ${yIndex}`,
          status: "success",
          position: "top",
          duration: 3000,
          isClosable: true,
        })
      } catch (error) {
        const errorMessage = error.message || "An error occurred"
        toast({
          title: "Error",
          description: errorMessage,
          status: "error",
          position: "top",
          duration: 3000,
          isClosable: true,
        })
      }
    }
  }, [dispatch, gap, rowHeight, columnWidth, id])

  return (
    <ChakraProvider theme={theme}>
      <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} data-testid="drop-area">

      <Box display="flex" height="600px" width="100%" marginTop={`${gap*2}px`}>
        <Box
          display="grid"
          gridTemplateRows={`repeat(${yLabels.length + 1}, ${rowHeight}px)`}
          gap={`${gap}px`}
          position="sticky"
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
              <Text fontWeight="bold" color="black">{label}</Text>
            </Box>
          ))}
        </Box>

        <Box overflow="auto" width="100%" position="relative">
          <Box
            display="grid"
            gridTemplateColumns={`repeat(${xLabels.length}, ${columnWidth}px)`}
            gap={`${gap}px`}
            position="sticky"
            top={0}
            zIndex={1}
            bg={"transparent"}
            mb={`${gap}px`}
            ref={containerRef}
          >
            {xLabels.map((label) => (
              <Box
                key={label}
                display="flex"
                alignItems="center"
                justifyContent="center"
                bg="gray.200"
                borderRadius="md"
                h={`${rowHeight}px`}
                width={`${columnWidth}px`}
              >
                <Text fontWeight="bold" color="black">{label}</Text>
              </Box>
            ))}
          </Box>

          <GridLayout
            className="layout"
            layout={layout}
            cols={xLabels.length}
            rowHeight={rowHeight}
            width={xLabels.length * columnWidth + (xLabels.length - 1) * gap}
            isResizable={false}
            compactType={null}
            isBounded={false}
            preventCollision={true}
            margin={[gap, gap]}
            containerPadding={[0, 0]}
            useCSSTransforms={true}
            onDragStop={handlePositionChange}
            maxRows={maxScreen}
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
                onDoubleClick={handleDoubleClick}
              >
                <Box position="relative" h="100%">
                  <IconButton
                    icon={<CloseIcon />}
                    size="xs"
                    position="absolute"
                    _hover={{ bg: "red.500", color: "white" }}
                    backgroundColor="red.300"
                    draggable={false}
                    zIndex="10"
                    top="0px"
                    right="0px"
                    aria-label={`Delete ${cue.name}`}
                    onMouseDown={(e) => {
                      e.stopPropagation()
                      handleRemoveItem(cue._id)
                      }
                    }
                  />
                  <img
                    src={cue.file.url}
                    alt={cue.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "10px" }}
                  />
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
                      style={{ 
                        textShadow: "2px 2px 4px rgba(0,0,0,1)" 
                      }}
                    >
                      {cue.name}
                    </Text>
                  </Tooltip>
                </Box>
              </div>
            ))}
          </GridLayout>
        </Box>
          {selectedCue && (
            <EditToolBox
              isOpen={isEditOpen}
              onClose={() => setIsEditOpen(false)}
              cueData={selectedCue}
              updateCue={updateCue}
            />
          )}
        <Box 
        position="fixed" 
        top="11%" 
        right="5%" 
        display="flex"
        alignItems="center"
        zIndex={1}
      >
        <Tooltip
          label={status === "loading" ? "Saving in progress..." : "Your changes are saved!"}
          aria-label="Status Tooltip"
          placement="right"
          zIndex="tooltip"
        >
          <Box>
            {status === "loading" ? (
              <Spinner size="md" color="purple.200" />
            ) : (
              <CheckIcon w={6} h={6} color="purple.200" />
            )}
          </Box>
        </Tooltip>
      </Box>
      </Box>
      </div>
    </ChakraProvider>
  )
}

export default EditMode