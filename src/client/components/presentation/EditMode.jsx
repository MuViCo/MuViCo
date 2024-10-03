import React, { useState } from "react"
import { Box, Text, ChakraProvider, extendTheme } from "@chakra-ui/react"
import GridLayout from "react-grid-layout"
import "react-grid-layout/css/styles.css" // Import necessary styles
import "react-resizable/css/styles.css"

// Chakra UI theme (optional)
const theme = extendTheme({})

const EditMode = ({ cues }) => {
  const xLabels = Array.from(new Set(cues.map((cue) => `Cue ${cue.index}`)))
  const yLabels = Array.from(new Set(cues.map((cue) => `Screen ${cue.screen}`)))

  // Define the layout for GridLayout based on cues
  const layout = cues.map((cue) => ({
    i: cue._id.toString(),
    x: cue.index + 1, // Adjust to start from column 1
    y: cue.screen, // Adjust to 0-based index
    w: 1,
    h: 1,
    static: false,
  }))

  return (
    <ChakraProvider theme={theme}>
      <Box p={4}>
        <GridLayout
          className="layout"
          layout={layout}
          cols={xLabels.length + 1} // Extra column for Y labels
          rowHeight={100}
          width={1200}
          isResizable={false} // Disable resizing
          useCSSTransforms={true}
          compactType={null} // Allow free movement
        >
          {/* X-axis labels (Placed in the top row starting from column 1) */}
          {xLabels.map((label, index) => (
            <div key={`x-label-${index}`} data-grid={{ x: index + 1, y: 0, w: 1, h: 1, static: true }}>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                bg="gray.200"
                border="1px solid gray"
                h="100%"
              >
                <Text fontWeight="bold">{label}</Text>
              </Box>
            </div>
          ))}

          {/* Y-axis labels (Placed in the first column of each row starting from row 1) */}
          {yLabels.map((label, index) => (
            <div key={`y-label-${index}`} data-grid={{ x: 0, y: index + 1, w: 1, h: 1, static: true }}>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                bg="gray.200"
                border="1px solid gray"
                h="100%"
              >
                <Text fontWeight="bold">{label}</Text>
              </Box>
            </div>
          ))}

          {/* Movable grid items based on cues */}
          {cues.map((cue) => (
            <div key={cue._id} data-grid={{ x: cue.index + 1, y: cue.screen, w: 1, h: 1, static: false }}>
              <Box
                position="relative"
                h="100%"
                border="1px solid gray"
              >
                <img src={cue.file.url} alt={cue.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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
    </ChakraProvider>
  )
}

export default EditMode