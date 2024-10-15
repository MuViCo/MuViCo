import React from "react"
import { Box, Text, ChakraProvider, extendTheme, useColorModeValue, IconButton} from "@chakra-ui/react"
import { CloseIcon } from "@chakra-ui/icons"
import GridLayout from "react-grid-layout"
import "react-grid-layout/css/styles.css"
import "react-resizable/css/styles.css"
import { useDispatch } from "react-redux"
import { useToast } from "@chakra-ui/react"
import { removeCue } from "../../redux/presentationReducer"

const theme = extendTheme({})

const EditMode = ({ id, cues }) => {
  const toast = useToast()
  const dispatch = useDispatch()

  const xLabels = Array.from({ length: 101 }, (_, index) => `Cue ${index}`)
  const maxScreen = Math.max(...cues.map(cue => cue.screen))
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

  const gapColor = useColorModeValue("gray.100", "gray.700")

  const handlePositionChange = (layout, oldItem, newItem) => {
    console.log(`Cue moved from position (${oldItem.x}, ${oldItem.y}) to (${newItem.x}, ${newItem.y})`)
    const convertedLayout = layout.map(item => ({
      id: item.i,
      cueIndex: item.x,
      screen: item.y + 1,
    }))
    
    console.log("new layout",convertedLayout)
  }
  
  const handleRemoveItem = async (cueId) => {
    console.log(`handleRemoveItem called with cueId: ${cueId}`)
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
      toast({
        title: "Error",
        description: error.response?.data?.error || "An error occurred while removing the cue.",
        status: "error",
        position: "top",
        duration: 3000,
        isClosable: true,
      })
    }
  }

  return (
    <ChakraProvider theme={theme}>
      <Box display="flex" height="600px" width="100%">
        <Box
          display="grid"
          gridTemplateRows={`repeat(${yLabels.length + 1}, ${rowHeight}px)`}
          gap={`${gap}px`}
          position="sticky"
          left={0}
          zIndex={2}
          bg={gapColor}
          borderRight="1px solid gray"
        >
          <Box h={`${rowHeight}px`} bg="transparent" />

          {yLabels.map((label) => (
            <Box
              key={label}
              display="flex"
              alignItems="center"
              justifyContent="center"
              bg="gray.200"
              border="1px solid gray"
              h={`${rowHeight}px`}
              width={`${columnWidth}px`}
            >
              <Text fontWeight="bold">{label}</Text>
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
            bg={gapColor}
            mb={`${gap}px`}
          >
            {xLabels.map((label) => (
              <Box
                key={label}
                display="flex"
                alignItems="center"
                justifyContent="center"
                bg="gray.200"
                border="1px solid gray"
                h={`${rowHeight}px`}
                width={`${columnWidth}px`}
              >
                <Text fontWeight="bold">{label}</Text>
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
                      console.log(`Remove cue with ID: ${cue._id}`)
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