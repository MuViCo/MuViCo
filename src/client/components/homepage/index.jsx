import { Container } from "@chakra-ui/react"
import { useNavigate } from "react-router-dom"
import { useState, useEffect, useRef } from "react"

import presentationService from "../../services/presentations"
import AdminControls from "./AdminControls"
import PresentationsGrid from "./PresentationsGrid"
import PresentationFormWrapper from "./PresentationFormWrapper"
import addInitialElements from "../utils/addInitialElements"
import { useCustomToast } from "../utils/toastUtils"
import useDeletePresentation from "../utils/useDeletePresentation"
import Dialog from "../utils/AlertDialog"

const HomePage = ({ user }) => {
  const [presentations, setPresentations] = useState([])
  const navigate = useNavigate()
  const togglableRef = useRef(null)
  const showToast = useCustomToast()
  const {
    isDialogOpen,
    handleDeletePresentation,
    handleConfirmDelete,
    handleCancelDelete,
  } = useDeletePresentation()

  useEffect(() => {
    const getPresentationData = async () => {
      try {
        const updatedPresentations = await presentationService.getAll()
        setPresentations(updatedPresentations)
      } catch (error) {
        if (error.response && error.response.status === 401) {
          // Handle 401 Unauthorized error
          navigate("/")
        }
      }
    }
    getPresentationData()
  }, [navigate])

  const createPresentation = async (presentationObject) => {
    try {
      await presentationService.create(presentationObject)
      const updatedPresentations = await presentationService.getAll()
      setPresentations(updatedPresentations)
      const presentationId =
        updatedPresentations[updatedPresentations.length - 1].id

      await addInitialElements(presentationId, showToast)
      navigate(`/presentation/${presentationId}`)
    } catch (error) {
      console.error("Error creating presentation:", error)
    }
  }

  const handlePresentationClick = (presentationId) => {
    navigate(`/presentation/${presentationId}`)
  }

  const handleCancel = () => {
    togglableRef.current.toggleVisibility()
  }

  return (
    <Container maxW="container.lg">
      <AdminControls isAdmin={user.isAdmin} navigate={navigate} />
      <PresentationFormWrapper
        createPresentation={createPresentation}
        togglableRef={togglableRef}
        handleCancel={handleCancel}
      />
      <PresentationsGrid
        presentations={presentations}
        handlePresentationClick={handlePresentationClick}
        handleDeletePresentation={handleDeletePresentation}
      />
      <Dialog
        isOpen={isDialogOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        message="Are you sure you want to delete this presentation?"
      />
    </Container>
  )
}

export default HomePage
