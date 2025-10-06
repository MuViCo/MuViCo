import {
  Button,
  Container,
  Box,
  useDisclosure,
  IconButton,
} from "@chakra-ui/react"
import { QuestionIcon } from "@chakra-ui/icons"
import { useNavigate } from "react-router-dom"
import { useState, useEffect, useRef } from "react"
import StorageInfoModal from "./StorageInfoModal"
import presentationService from "../../services/presentations"
import userService from "../../services/users"
import AdminControls from "./AdminControls"
import PresentationsGrid from "./PresentationsGrid"
import PresentationFormWrapper from "./PresentationFormWrapper"
import LinkGoogleDriveButton from "./LinkGoogleDriveButton"
import addInitialElements from "../utils/addInitialElements"
import { useCustomToast } from "../utils/toastUtils"
import useDeletePresentation from "../utils/useDeletePresentation"
import Dialog from "../utils/AlertDialog"

const HomePage = ({ user, setUser }) => {
  const [presentations, setPresentations] = useState([])
  const navigate = useNavigate()
  const togglableRef = useRef(null)
  const showToast = useCustomToast()
  const {
    isDialogOpen,
    handleDeletePresentation,
    handleConfirmDelete,
    handleCancelDelete,
    presentationToDelete,
  } = useDeletePresentation()
  const { isOpen, onOpen, onClose } = useDisclosure()

  useEffect(() => {
    const getPresentationData = async () => {
      try {
        const updatedPresentations = await presentationService.getAll()
        setPresentations(updatedPresentations)
      } catch (error) {
        if (error.response && error.response.status === 401) {
          navigate("/")
        }
      }
    }
    getPresentationData()
  }, [navigate])

  const createPresentation = async (presentationObject) => {
    try {
      const createdPresentation = await presentationService.create(presentationObject)
      const updatedPresentations = await presentationService.getAll()
      setPresentations(updatedPresentations)
      localStorage.setItem(`presentation-${createdPresentation.id}-startingColor`, presentationObject.startingFrameColor)
      
      await addInitialElements(createdPresentation.id, presentationObject.screenCount, showToast, presentationObject.startingFrameColor)
      navigate(`/presentation/${createdPresentation.id}`)
    } catch (error) {
      console.error("Error creating presentation: ", error)
    }
  }

  const handlePresentationClick = (presentationId) => {
    navigate(`/presentation/${presentationId}`)
  }

  const handleCancel = () => {
    togglableRef.current.toggleVisibility()
  }

  const handleDialogConfirm = async () => {
    try {
      await handleConfirmDelete()
      setPresentations(
        presentations.filter((p) => p.id !== presentationToDelete)
      )
    } catch (e) {
      console.error("Error deleting presentation: ", e)
    }
  }

  const handleDriveLinked = async (updatedUser) => {
    setUser(updatedUser)

    const updatedPresentations = await presentationService.getAll()
    setPresentations(updatedPresentations)
  }

  const handleDriveOff = async () => {
    try {
      window.localStorage.removeItem("driveAccessToken")

      const currentUser = JSON.parse(window.localStorage.getItem("user"))
      const updatedUser = { ...currentUser, driveToken: null }
      window.localStorage.setItem("user", JSON.stringify(updatedUser))

      await userService.unlinkDrive()

      setUser(updatedUser)

      const updatedPresentations = await presentationService.getAll()
      setPresentations(updatedPresentations)

      showToast({
        title: "AWS linked successfully",
        status: "success",
      })
    } catch (error) {
      console.error("Error linking AWS:", error)
      showToast({
        title: "Failed to link AWS",
        status: "error",
      })
    }
  }

  return (
    <Container maxW="container.lg">
      <AdminControls isAdmin={user.isAdmin} navigate={navigate} />

      <Box
        display="flex"
        flexDirection={["column", "row"]}
        alignItems={["flex-start", "center"]}
        justifyContent="space-between"
        p={4}
        gap={4}
      >
        <PresentationFormWrapper
          createPresentation={createPresentation}
          togglableRef={togglableRef}
          handleCancel={handleCancel}
        />

        <Box display="flex" alignItems="center" gap={1}>
          {user.driveToken ? (
            <Button onClick={handleDriveOff}>Link AWS</Button>
          ) : (
            <LinkGoogleDriveButton onDriveLinked={handleDriveLinked} />
          )}
          <IconButton
            icon={<QuestionIcon />}
            variant="ghost"
            size="lg"
            ml={1}
            onClick={onOpen}
            colorScheme="purple"
          />
          <StorageInfoModal isOpen={isOpen} onClose={onClose} user={user} />
        </Box>
      </Box>

      <PresentationsGrid
        presentations={presentations}
        handlePresentationClick={handlePresentationClick}
        handleDeletePresentation={handleDeletePresentation}
      />
      <Dialog
        isOpen={isDialogOpen}
        onClose={handleCancelDelete}
        onConfirm={handleDialogConfirm}
        message="Are you sure you want to delete this presentation?"
      />
    </Container>
  )
}

export default HomePage
