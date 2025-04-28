import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button, Flex, Box, Text } from "@chakra-ui/react"
import { fetchPresentationInfo } from "../../redux/presentationReducer"
import "reactflow/dist/style.css"
import { useDispatch, useSelector } from "react-redux"

import ShowMode from "./ShowMode"
import EditMode from "./EditMode"
import Dialog from "../utils/AlertDialog"
import useDeletePresentation from "../utils/useDeletePresentation"

const PresentationPage = ({ user }) => {
  const { id } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [cueIndex, setCueIndex] = useState(0)
  const {
    isDialogOpen,
    handleDeletePresentation,
    handleConfirmDelete,
    handleCancelDelete,
  } = useDeletePresentation()

  const [presentationSize, setPresentationSize] = useState(0)
  const [showMode, setShowMode] = useState(false)
  const [isToolboxOpen, setIsToolboxOpen] = useState(false)
  const [isAudioMuted, setIsAudioMuted] = useState(false)

  // Fetch presentation info from Redux state
  const presentationInfo = useSelector((state) => state.presentation.cues)

  useEffect(() => {
    dispatch(fetchPresentationInfo(id))
  }, [id, navigate, dispatch])

  const handleShowMode = () => {
    setShowMode(!showMode)
  }

  const toggleAudioMute = () => {
    setIsAudioMuted((prevMuted) => !prevMuted)
  }

  useEffect(() => {
    if (presentationInfo) {
      const totalSize = presentationInfo.reduce((sum, cue) => {
        const fileSize = cue.file?.size || 0
        return !isNaN(fileSize) ? sum + Number(fileSize) : sum
      }, 0)
      const newSize = (totalSize / (1024 * 1024)).toFixed(2)
      if (presentationSize !== newSize) {
        setPresentationSize(newSize)
      }
    }
  }, [presentationInfo, presentationSize])

  return (
    <>
      {presentationInfo && (
        <Box
          width="100vw"
          height="95vh"
          margin={0}
          padding={0}
          display="flex"
          flexDirection="column"
        >
          <Flex flexDirection="row" flexWrap="wrap" gap={4} padding={4}>
            <Button colorScheme="gray" onClick={handleShowMode}>
              {showMode ? "Edit mode" : "Show mode"}
            </Button>
            {!showMode && (
              <>
                <Button
                  colorScheme="gray"
                  onClick={() => handleDeletePresentation(id)}
                >
                  Delete Presentation
                </Button>
                <Button
                  colorScheme="gray"
                  onClick={() => setIsToolboxOpen(true)}
                >
                  Add Element
                </Button>
              </>
            )}
            {user.driveToken === null ? (
              <Text alignSelf="center" data-testid="presentationSize">
                {presentationSize} MB / 50 MB
              </Text>
            ) : (
              <Text alignSelf="center" data-testid="presentationSize">
                {presentationSize} MB
              </Text>
            )}
          </Flex>
          <Box flex="1" padding={4} marginLeft="0px" overflow="auto">
            {" "}
            {/* Adjust marginLeft to move the grid to the left */}
            {showMode && (
              <ShowMode
                cues={presentationInfo}
                cueIndex={cueIndex}
                setCueIndex={setCueIndex}
              />
            )}
            <EditMode
              id={id}
              cues={presentationInfo}
              isToolboxOpen={isToolboxOpen}
              setIsToolboxOpen={setIsToolboxOpen}
              isShowMode={showMode === true}
              cueIndex={cueIndex}
              isAudioMuted={isAudioMuted}
              toggleAudioMute={toggleAudioMute}
            />
          </Box>
          <Dialog
            isOpen={isDialogOpen}
            onClose={handleCancelDelete}
            onConfirm={handleConfirmDelete}
            message="Are you sure you want to delete this presentation?"
          />
        </Box>
      )}
    </>
  )
}

export default PresentationPage
