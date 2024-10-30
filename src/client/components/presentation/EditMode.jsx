import React from "react"
import { Box, Text, ChakraProvider, extendTheme, useColorModeValue, IconButton} from "@chakra-ui/react"
import { CloseIcon } from "@chakra-ui/icons"
import GridLayout from "react-grid-layout"
import "react-grid-layout/css/styles.css"
import "react-resizable/css/styles.css"
import { useDispatch } from "react-redux"
import { useToast } from "@chakra-ui/react"
import { removeCue, updatePresentation } from "../../redux/presentationReducer"

const theme = extendTheme({})

const EditMode = ({ id, cues }) => {
  const toast = useToast()
  const dispatch = useDispatch()

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

  const handlePositionChange = async (layout, olditem, newItem) => {
    const movedCue = {
      cueId: newItem.i,
      cueIndex: newItem.x,
      screen: newItem.y+1,
    }
    if (movedCue) {
      try {
        await dispatch(updatePresentation(id, movedCue))
        toast({
          title: "Presentation saved",
          description: "The presentation has been successfully saved.",
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

  return (
    <ChakraProvider theme={theme}>
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
      </Box>
    </ChakraProvider>
  )
}

export default EditMode