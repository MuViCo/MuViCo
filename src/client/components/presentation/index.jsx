import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button, Flex, useToast, Box } from "@chakra-ui/react"
import { fetchPresentationInfo, deletePresentation } from "../../redux/presentationReducer"
import "reactflow/dist/style.css"
import { useDispatch, useSelector } from "react-redux"
import ShowMode from "./ShowMode"
import EditMode from "./EditMode"
import { useCustomToast } from "../utils/toastUtils"
import { createFormData } from "../utils/formDataUtils"
import { createCue } from "../../redux/presentationReducer"
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
  const showToast = useCustomToast()

  const [showMode, setShowMode] = useState(false)
  const [isToolboxOpen, setIsToolboxOpen] = useState(false)
  // Fetch presentation info from Redux state
  const presentationInfo = useSelector((state) => state.presentation.cues)

  useEffect(() => {
    dispatch(fetchPresentationInfo(id))
  }, [id, userId, navigate, dispatch])

  useEffect(() => {
    console.log("updated presentationInfo", presentationInfo)
  }, [presentationInfo])

  const handleShowMode = () => {
    setShowMode(!showMode)
  }
  
  const addBlankCue = async (screen) => {
    
    const formData = createFormData(0, `initial element for screen ${screen}`, screen, "/blank.png")
    try {
      await dispatch(createCue(id, formData))
      showToast({
        title: "Element added",
        description: `Initial element added to screen ${screen}`,
        status: "success",
      })
    } catch (error) {
      const errorMessage = error.message || "An error occurred"
      showToast({
        title: "Error",
        description: errorMessage,  
        status: "error",
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
      showToast({
        title: "Error",
        description: errorMessage,
        status: "error",
      })
    }
  }

  return (
    <>
      { presentationInfo && (
        <Box width="100vw" height="95vh" margin={0} padding={0} display="flex" flexDirection="column">
          <Flex flexDirection="row" flexWrap="wrap" gap={4} padding={4}>
            <Button colorScheme="gray" onClick={handleShowMode}>
              {showMode ? "Edit mode" : "Show mode"}
            </Button>
            {!showMode && (
              <>
                <Button colorScheme="gray" onClick={() => handleDeletePresentation(id)}>
                  Delete Presentation
                </Button>
                <Button colorScheme="gray" onClick={() => setIsToolboxOpen(true)}>
                  Add Element
                </Button>
              </>
            )}
          </Flex>
          <Box flex="1" padding={4} marginLeft="0px" overflow="auto"> {/* Adjust marginLeft to move the grid to the left */}
            {showMode && <ShowMode cues={presentationInfo}  />}
            <EditMode id={id} cues={presentationInfo} isToolboxOpen={isToolboxOpen} setIsToolboxOpen={setIsToolboxOpen} addBlankCue={addBlankCue}/>
          </Box>
        </Box>
      )}
    </>
  )
}

export default PresentationPage
