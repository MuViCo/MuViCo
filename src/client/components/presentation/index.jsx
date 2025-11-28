import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button, Flex, Box, Text, IconButton, Input, Select, useToast } from "@chakra-ui/react"
import { fetchPresentationInfo } from "../../redux/presentationReducer"
import "reactflow/dist/style.css"
import { useDispatch, useSelector } from "react-redux"

import ShowMode from "./ShowMode"
import EditMode from "./EditMode"
import PresentationTitle from "./PresentationTitle"
import Dialog from "../utils/AlertDialog"
import useDeletePresentation from "../utils/useDeletePresentation"
import TutorialGuide from "../tutorial/TutorialGuide"
import { presentationTutorialSteps } from "../data/tutorialSteps"

const PresentationPage = ({ user }) => {
  const { id } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [cueIndex, setCueIndex] = useState(0)
  const [showHint, setShowHint] = useState(false)
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
  const [isTransitionMenuOpen, setIsTransitionMenuOpen] = useState(false)
  const [transitionType, setTransitionType] = useState("fade")

  const toast = useToast()

  useEffect(() => {
    try {
      const storedTransition = localStorage.getItem(`presentation-${id}-transition`)
      if (storedTransition) setTransitionType(storedTransition)
    } catch (err) {
      console.warn("Could not read persisted transition preference:", err)
      toast({
        title: "Error",
        description: "Could not read persisted transition preference.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      })
    }
  }, [id, toast])

  // Fetch presentation info from Redux state
  const presentationInfo = useSelector((state) => state.presentation.cues)
  const presentationName = useSelector((state) => state.presentation.name)
  const indexCount = useSelector((state) => state.presentation.indexCount)

  document.body.style.overflowX = "hidden"

  document.title = `Viewing ${presentationName} | MuViCo`

  useEffect(() => {
    dispatch(fetchPresentationInfo(id))
  }, [id, navigate, dispatch])

  const handleShowMode = () => {
    setShowMode(!showMode)
  }

  useEffect(() => {
    const hasSeen = localStorage.getItem("hasSeenHelp_presentation")
    if (!hasSeen) {
      setShowHint(true)
    }
  }, [])

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
      <PresentationTitle
        id={id}
        presentationName={presentationName}
        showMode={showMode}
      />
      {presentationInfo && (
        <Box
          width="100vw"
          margin={0}
          padding={0}
          display="flex"
          flexDirection="column"
        >
          <Flex flexDirection="row" flexWrap="wrap" gap={4} padding={4}>
            <Button
              colorScheme="gray"
              onClick={handleShowMode}
              id="toggle-show-mode-button"
            >
              {showMode ? "Edit mode" : "Show mode"}
            </Button>
            {!showMode && (
              <>
                <Button
                  colorScheme="gray"
                  id="delete-presentation-button"
                  onClick={() => handleDeletePresentation(id)}
                >
                  Delete Presentation
                </Button>
                <Button
                  colorScheme="gray"
                  id="add-element-button"
                  onClick={() => setIsToolboxOpen(true)}
                >
                  Add Element
                </Button>
                {user.driveToken === null ? (
              <Text alignSelf="center" data-testid="presentationSize" className="presentation-size-info">
                {presentationSize} MB / 50 MB
              </Text>
            ) : (
              <Text alignSelf="center" data-testid="presentationSize" className="presentation-size-info">
                {presentationSize} MB
              </Text>
            )}
                <Box
                  width="100vw"
                  margin={0}
                  padding={0}
                  display="flex"
                  flexDirection="column"
                >
                <Text mb={2} fontWeight={700}>Transition Type:</Text>
                <Select
                  colorScheme="gray"
                  data-testid="transition-type-select"
                  value={transitionType}
                  onChange={(e) => {
                    const val = e.target.value
                    setTransitionType(val)
                    try {
                      localStorage.setItem(`presentation-${id}-transition`, val)
                    } catch (err) {
                      console.warn("Could not persist transition preference:", err)
                      toast({
                        title: "Error",
                        description: "Could not persist transition preference.",
                        status: "warning",
                        duration: 5000,
                        isClosable: true,
                      })
                    }
                  }}
                  width="200px"
                  minW="140px"
                >
                  <option value="fade">Fade</option>
                  <option value="slide-left">Slide From Left</option>
                  <option value="slide-right">Slide From Right</option>
                  <option value="zoom">Zoom</option>
                  <option value="none">None</option>
                </Select>
                </Box>
              </>
            )}
          </Flex>
          <Box flex="1" padding={4} marginLeft="0px" overflow="auto" id="presentations-grid">
            {" "}
            {/* Adjust marginLeft to move the grid to the left */}
            <ShowMode
              cues={presentationInfo}
              cueIndex={cueIndex}
              setCueIndex={setCueIndex}
              indexCount={indexCount}
              transitionType={transitionType}
              isHidden={!showMode}
            />
            <EditMode
              id={id}
              cues={presentationInfo}
              isToolboxOpen={isToolboxOpen}
              setIsToolboxOpen={setIsToolboxOpen}
              isTransitionMenuOpen={isTransitionMenuOpen}
              setIsTransitionMenuOpen={setIsTransitionMenuOpen}
              transitionType={transitionType}
              setTransitionType={setTransitionType}
              isShowMode={showMode === true}
              cueIndex={cueIndex}
              isAudioMuted={isAudioMuted}
              toggleAudioMute={toggleAudioMute}
              indexCount={indexCount}
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
      <TutorialGuide
        steps={presentationTutorialSteps}
        isOpen={showHint}
        onClose={() => setShowHint(false)}
        storageKey={"hasSeenHelp_presentation"}
      />
    </>
  )
}

export default PresentationPage
