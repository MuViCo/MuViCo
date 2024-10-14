import React, { useState } from "react"
import { Box, Text, ChakraProvider, extendTheme, useColorModeValue, IconButton} from "@chakra-ui/react"
import { CloseIcon } from "@chakra-ui/icons"
import GridLayout from "react-grid-layout"
import "react-grid-layout/css/styles.css"
import "react-resizable/css/styles.css"

const theme = extendTheme({})

const EditMode = ({ cues }) => {
  const xLabels = Array.from({ length: 101 }, (_, index) => `Cue ${index}`)
  const maxScreen = Math.max(...cues.map(cue => cue.screen))
  const yLabels = Array.from({ length: maxScreen }, (_, index) => `Screen ${index + 1}`)

  const [layout, setLayout] = useState(cues.map((cue) => ({
    i: cue._id.toString(),
    x: cue.index,
    y: cue.screen - 1,
    w: 1,
    h: 1,
    static: false,
  })))

  const columnWidth = 150
  const rowHeight = 100
  const gap = 10

  const gapColor = useColorModeValue("blue.100", "green.700")

  const handlePositionChange = (layout, oldItem, newItem) => {
    if (oldItem.x === newItem.x && oldItem.y === newItem.y) {
      return
    }
    console.log(`Cue moved from position (${oldItem.x}, ${oldItem.y}) to (${newItem.x}, ${newItem.y})`)
    
    console.log("Current layout:")
    layout.forEach(item => {
      console.log(`Cue ID: ${item.i}, Position: (${item.x}, ${item.y})`)
    })
  }

  const handleRemoveItem = (cueId) => {
    console.log(`handleRemoveItem called with cueId: ${cueId}`)
    setLayout(prevLayout => {
      const newLayout = prevLayout.filter(item => item.i !== cueId)
      console.log("new layout:", newLayout)
    })
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
            isBounded={true}
            preventCollision={false}
            margin={[gap, gap]}
            containerPadding={[0, 0]}
            useCSSTransforms={true}
            onDragStop={handlePositionChange}
            maxRows={yLabels.length}
            maxCols={xLabels.length}
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
                    backgroundColor="red.200"
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
                    p={1}
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