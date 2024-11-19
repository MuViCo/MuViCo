import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button, Flex, useToast, Box } from "@chakra-ui/react"
import { fetchPresentationInfo, createCue, deletePresentation } from "../../redux/presentationReducer"
import "reactflow/dist/style.css"
import { useDispatch, useSelector } from "react-redux"
import ShowMode from "./ShowMode"
import EditMode from "./EditMode"
import ToolBox from "./ToolBox"
/**
 * Renders the presentation page.
 *
 * @component
 * @param {Object} props - The component props.
 * @param {string} props.userId - The user ID.
 * @returns {JSX.Element} The presentation page component.
 */

const PresentationPage = ({ userId }) => {
  const { id } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const toast = useToast()

  const [showMode, setShowMode] = useState(false)
  // Fetch presentation info from Redux state
  const presentationInfo = useSelector((state) => state.presentation.presentationInfo)

  useEffect(() => {
    dispatch(fetchPresentationInfo(id))
  }, [id, userId, navigate, dispatch])

  const handleShowMode = () => {
    setShowMode(!showMode)
  }
  
  const addBlankCue = async (screen) => {
    const formData = new FormData()
    formData.append("index", 0)
    formData.append("cueName", `initial cue for screen ${screen}`)
    formData.append("screen", screen)
    formData.append("image", "/blank.png")
  
    try {
      await dispatch(createCue(id, formData))
      toast({
        title: "Cue added",
        description: `Initial cue added to screen ${screen}`,
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


  const addCue = async (cueData) => {
    const { index, cueName, screen, file } = cueData
    const formData = new FormData()
  
    // Check if cue is the first cue to be added to the screen
    const screenCues = presentationInfo.cues.filter(
      (cue) => cue.screen === Number(screen)
    )
    if (screenCues.length === 0) {
      await addBlankCue(screen)
    }
  
    // Check if cue with same index and screen already exists
    const cueExists = presentationInfo.cues.some(
      (cue) => cue.index === Number(index) && cue.screen === Number(screen)
    )
    if (cueExists) {
      toast({
        title: "Cue already exists",
        description: `Cue with index ${index} already exists on screen ${screen}`,
        status: "error",
        position: "top",
        duration: 3000,
        isClosable: true,
      })
      return
    }
  
    // Add the new cue
    formData.append("index", index)
    formData.append("cueName", cueName)
    formData.append("screen", screen)
    
    if (!file) {
      formData.append("image", "/blank.png")
    } else {
      formData.append("image", file)
    }
  
    try {
      await dispatch(createCue(id, formData))
      toast({
        title: "Cue added",
        description: `Cue ${cueName} added to screen ${screen}`,
        status: "success",
        position: "top",
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      const errorMessage = error.message
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

  const handleDeletePresentation = async (id) => {
    if (!window.confirm("Are you sure you want to delete this presentation?"))
      return // eslint-disable-line
    try {
      await dispatch(deletePresentation(id))
      navigate("/home")
    }
    catch (error) {
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
    <>
      {presentationInfo && (
        <Box width="100vw" height="95vh" margin={0} padding={0} display="flex" flexDirection="column">
          <Flex flexDirection="row" flexWrap="wrap" gap={4} padding={4}>
            <Button colorScheme="gray" onClick={handleShowMode}>
              {showMode ? "Edit mode" : "Show mode"}
            </Button>
            {!showMode && (
              <>
                <ToolBox addCue={addCue} />
                <Button colorScheme="gray" onClick={() => handleDeletePresentation(presentationInfo.id)}>
                  Delete Presentation
                </Button>
              </>
            )}
          </Flex>
          <Box flex="1" padding={4} marginLeft="0px" overflow="auto"> {/* Adjust marginLeft to move the grid to the left */}
            {showMode && <ShowMode presentationInfo={presentationInfo} />}
            <EditMode id={presentationInfo.id} cues={presentationInfo.cues}/>
          </Box>
        </Box>
      )}
    </>
  )
}

export default PresentationPage
