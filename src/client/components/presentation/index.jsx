import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button, Flex, useToast, Box } from "@chakra-ui/react"
import { fetchPresentationInfo, createCue, deletePresentation, updatePresentation } from "../../redux/presentationReducer"
import "reactflow/dist/style.css"
import { useDispatch, useSelector } from "react-redux"
import ShowMode from "./ShowMode"
import EditMode from "./EditMode"
import ToolBox from "./ToolBox"
import EditToolBox from "./EditToolBox"
import { createFormData } from "../utils/formDataUtils"
/**
 * Renders the presentation page.
 *
 * @component
 * @param {Object} props - The component props.
 * @param {string} props.userId - The user ID.
 * @returns {JSX.Element} The presentation page component.
 */

const PresentationPage = ({ userId, setUser }) => {
  const { id } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const toast = useToast()

  const [showMode, setShowMode] = useState(false)
  const [isToolboxOpen, setIsToolboxOpen] = useState(false)
  // Fetch presentation info from Redux state
  const presentationInfo = useSelector((state) => state.presentation.presentationInfo)

  useEffect(() => {
    dispatch(fetchPresentationInfo(id))
  }, [id, userId, navigate, dispatch])

  const handleShowMode = () => {
    setShowMode(!showMode)
  }
  
  const addBlankCue = async (screen) => {
    
    const formData = createFormData(0, `initial element for screen ${screen}`, screen, "/blank.png")
    try {
      await dispatch(createCue(id, formData))
      toast({
        title: "Element added",
        description: `Initial element added to screen ${screen}`,
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
                <Button colorScheme="gray" onClick={() => handleDeletePresentation(presentationInfo.id)}>
                  Delete Presentation
                </Button>
                <Button colorScheme="gray" onClick={() => setIsToolboxOpen(true)}>
                  Add Element
                </Button>
              </>
            )}
          </Flex>
          <Box flex="1" padding={4} marginLeft="0px" overflow="auto"> {/* Adjust marginLeft to move the grid to the left */}
            {showMode && <ShowMode presentationInfo={presentationInfo} />}
            <EditMode id={presentationInfo.id} cues={presentationInfo.cues} isToolboxOpen={isToolboxOpen} setIsToolboxOpen={setIsToolboxOpen} addBlankCue={addBlankCue}/>
          </Box>
        </Box>
      )}
    </>
  )
}

export default PresentationPage
