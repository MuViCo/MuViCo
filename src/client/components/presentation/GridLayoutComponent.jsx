import React from "react"
import { Box, IconButton, Tooltip, Text } from "@chakra-ui/react" // Ensure Text is imported
import { CloseIcon } from "@chakra-ui/icons"
import GridLayout from "react-grid-layout"
import "react-grid-layout/css/styles.css"
import "react-resizable/css/styles.css"
import { useDispatch } from "react-redux"
import { updatePresentation, fetchPresentationInfo, removeCue } from "../../redux/presentationReducer"
import { useCustomToast } from "../utils/toastUtils"

const GridLayoutComponent = ({ id, layout, cues, setStatus, columnWidth, rowHeight, gap }) => {
    const showToast = useCustomToast()
    const dispatch = useDispatch()

    const handleRemoveItem = async (cueId) => {
        if (!window.confirm("Are you sure you want to delete this element?")) return
    
        try {
          await dispatch(removeCue(id, cueId))
          showToast({
            title: "Element removed",
            description: `Element with ID ${cueId} has been removed.`,
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

    const handlePositionChange = async (layout, oldItem, newItem) => {

        if (oldItem.x === newItem.x && oldItem.y === newItem.y) {
          return
        }
        const movedCue = {
          cueId: newItem.i,
          index: newItem.x,
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
            await dispatch(fetchPresentationInfo(id))
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
          maxRows={Math.max(...cues.map((cue) => cue.screen), 4)}
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
                  }}
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
                      textShadow: "2px 2px 4px rgba(0,0,0,1)",
                    }}
                  >
                    {cue.name}
                  </Text>
                </Tooltip>
              </Box>
            </div>
          ))}
        </GridLayout>
      )
    }
    
export default GridLayoutComponent