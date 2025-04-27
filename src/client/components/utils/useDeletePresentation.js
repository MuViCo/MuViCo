import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useDispatch } from "react-redux"
import { deletePresentation } from "../../redux/presentationReducer"
import { useCustomToast } from "./toastUtils"

const useDeletePresentation = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [presentationToDelete, setPresentationToDelete] = useState(null)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const showToast = useCustomToast()

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
    // Clean up state
    setIsDialogOpen(false)
    setPresentationToDelete(null)
  }

  // Cancel deletion: Close the confirmation dialog
  const handleCancelDelete = () => {
    setIsDialogOpen(false)
    setPresentationToDelete(null)
  }

  return {
    isDialogOpen,
    handleDeletePresentation,
    handleConfirmDelete,
    handleCancelDelete,
    presentationToDelete,
  }
}

export default useDeletePresentation
