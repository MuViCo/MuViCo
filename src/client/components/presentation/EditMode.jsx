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
import { removeCue, updatePresentation, createCue } from "../../redux/presentationReducer"

const theme = extendTheme({})

const EditMode = ({ id, cues }) => {
  const toast = useToast()
  const dispatch = useDispatch()
  const containerRef = useRef(null)

  // for ui element
  const [status, setStatus] = useState("saved")

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
    
    if (movedCue) {
      setStatus("loading")
      try {
        await dispatch(updatePresentation(id, movedCue))
        setTimeout(() => setStatus("saved"), 300) // Delay is purely for visuals
      } catch (error) {
        console.error(error) 
      }
    }
  }

  
  const handleRemoveItem = async (cueId) => {
    if (!window.confirm("Are you sure you want to delete this cue?")) return

    try {
      await dispatch(removeCue(id, cueId))
      toast({
        title: "Cue removed",
        description: `Cue with ID ${cueId} has been removed.`,
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
  const handleDrop = useCallback((e) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    const imageFiles = files.filter((file) => file.type.startsWith("image/"))
    
    if (containerRef.current) {
      const dropX = e.clientX

      const containerRect = containerRef.current.getBoundingClientRect()
      const containerScrollLeft = containerRef.current.scrollLeft

      const relativeX = dropX - containerRect.left
      const realX = relativeX + containerScrollLeft
      const mouseY = e.clientY - containerRect.top

      const effectiveCellWidth = columnWidth + gap
      const effectiveCellHeight = rowHeight + gap

      const yIndex = Math.floor(mouseY / effectiveCellHeight)
      const xIndex = Math.floor(realX / effectiveCellWidth)

      console.log("xIndex", xIndex)
      console.log("yIndex", yIndex)
      imageFiles.forEach((file, index) => {
        const formData = new FormData()
        formData.append("index", xIndex)
        formData.append("cueName", file.name)
        formData.append("screen", yIndex)
        formData.append("image", file)
  
        dispatch(createCue(id, formData))
      })
    }
    }, [dispatch, gap, rowHeight, columnWidth, id])

  return (
    <ChakraProvider theme={theme}>
      <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} >

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
                  <Text
                    position="absolute"
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -50%)"
                    color="white"
                    fontWeight="bold"
                    textAlign="center"
                    bg="rgba(0, 0, 0, 0.5)"
                    p={2}
                    borderRadius="md"
                  >
                    {cue.name}
                  </Text>
                </Box>
              </div>
            ))}
          </GridLayout>
        </Box>
          <Box position="absolute" top="105px" right="1050" display="flex" alignItems="center" zIndex={1}>
            <Tooltip label={status === "loading" ? "Loading..." : "Your changes are saved!"} aria-label="Status Tooltip" placement="right" zIndex="tooltip">
              <Box>
                {status === "loading" ? (
                  <>
                    <Spinner size="md" color="purple.200" />
                  </>
                ) : (
                  <>
                    <CheckIcon w={5} h={5} color="purple.200" />
                  </>
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