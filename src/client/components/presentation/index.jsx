import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button, Flex, Box } from "@chakra-ui/react"
import { fetchPresentationInfo, deletePresentation } from "../../redux/presentationReducer"
import "reactflow/dist/style.css"
import { useDispatch, useSelector } from "react-redux"
import ShowMode from "./ShowMode"
import EditMode from "./EditMode"
import { useCustomToast } from "../utils/toastUtils"
import Dialog from "../utils/AlertDialog"

/**
 * Renders the presentation page.
 *
 * @component
 * @param {Object} props - The component props.
 * @param {string} props.userId - The user ID.
 * @returns {JSX.Element} The presentation page component.
 */

const PresentationPage = () => {
  const { id } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const showToast = useCustomToast()

  const [showMode, setShowMode] = useState(false)
  const [isToolboxOpen, setIsToolboxOpen] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [presentationToDelete, setPresentationToDelete] = useState(null)
  // Fetch presentation info from Redux state
  const presentationInfo = useSelector((state) => state.presentation.cues)

  useEffect(() => {
    dispatch(fetchPresentationInfo(id))
  }, [dispatch, id])

  const handleShowMode = () => {
    setShowMode(!showMode)
  }

  const handleDeletePresentation = (presentationId) => {
    setPresentationToDelete(presentationId)
    setIsDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (presentationToDelete) {
      try {
        await dispatch(deletePresentation(presentationToDelete))
        showToast({
          title: "Presentation deleted",
          description: "The presentation has been deleted successfully.",
          status: "success",
        })
        navigate("/home")
      } catch (error) {
        showToast({
          title: "Error",
          description: error.message || "An error occurred",
          status: "error",
        })
      }
    }
    setIsDialogOpen(false)
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
            <EditMode id={id} cues={presentationInfo} isToolboxOpen={isToolboxOpen} setIsToolboxOpen={setIsToolboxOpen} />
          </Box>
          <Dialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onConfirm={handleConfirmDelete}
          message="Are you sure you want to delete this presentation?"
          />
        </Box>
      )}
    </>
  )
}

export default PresentationPage
