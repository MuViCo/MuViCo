/*
 * Home page component for displaying user's presentations (Presentations) and providing navigation options.
 * It includes features for creating, editing, and deleting all of users'presentations, as well as linking Google Drive for storage.
 * The component also incorporates a tutorial guide for new users and admin controls for users with admin privileges.
 */
import {
  Button,
  Container,
  Box,
  Flex,
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
import { useCustomToast } from "../utils/toastUtils"
import useDeletePresentation from "../utils/useDeletePresentation"
import Dialog from "../utils/AlertDialog"
import TutorialGuide from "../tutorial/TutorialGuide"
import { homePageTutorialSteps } from "../data/tutorialSteps"

import type { TogglableHandle } from "../utils/Togglable"
import type {
  AuthUser,
  CreatePresentationInput,
  Presentation,
  UpdatePresentationInput,
} from "../../types"

interface HomePageProps {
  user: AuthUser
  setUser: (user: AuthUser) => void
}

const HomePage = ({ user, setUser }: HomePageProps) => {
  const [presentations, setPresentations] = useState<Presentation[]>([])
  const [showHint, setShowHint] = useState(false)
  const navigate = useNavigate()
  const togglableRef = useRef<TogglableHandle>(null)
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
        console.error("Error fetching presentations: ", error)
      }
    }
    getPresentationData()
  }, [])

  useEffect(() => {
    const hasSeen = localStorage.getItem("hasSeenHelp_homepage")

    if (!hasSeen) {
      setShowHint(true)
    }
  }, [])

  const createPresentation = async (
    presentationObject: CreatePresentationInput
  ) => {
    try {
      const createdPresentation =
        await presentationService.create(presentationObject)
      const updatedPresentations = await presentationService.getAll()
      setPresentations(updatedPresentations)
      localStorage.setItem(
        `presentation-${createdPresentation.id}-startingColor`,
        presentationObject.startingFrameColor
      )

      navigate(`/presentation/${createdPresentation.id}`)
    } catch (error) {
      console.error("Error creating presentation: ", error)
    }
  }

  const handlePresentationClick = (presentationId: string) => {
    navigate(`/presentation/${presentationId}`)
  }

  const handleEditPresentation = async (
    presentationId: string,
    updatedPresentation: UpdatePresentationInput
  ) => {
    try {
      await presentationService.update(presentationId, updatedPresentation)
      const updatedPresentations = await presentationService.getAll()
      setPresentations(updatedPresentations)
    } catch (error) {
      console.error("Error updating presentation: ", error)
    }
  }

  const handleCancel = () => {
    // Non-null assertion, not optional chaining: handleCancel is only
    // reachable from the form the Togglable renders, and asserting keeps the
    // current behaviour if that ever stops being true.
    togglableRef.current!.toggleVisibility()
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

  const handleDriveLinked = async (updatedUser: AuthUser) => {
    setUser(updatedUser)

    const updatedPresentations = await presentationService.getAll()
    setPresentations(updatedPresentations)
  }

  const handleDriveOff = async () => {
    try {
      window.localStorage.removeItem("driveAccessToken")

      const currentUser = JSON.parse(
        window.localStorage.getItem("user") as string
      )
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
    <Container maxW="1280px" className="presentations-page">
      <AdminControls isAdmin={user.isAdmin} navigate={navigate} />

      <PresentationsGrid
        presentations={presentations}
        handlePresentationClick={handlePresentationClick}
        handleDeletePresentation={handleDeletePresentation}
        handleEditPresentation={handleEditPresentation}
        headerActions={
          <Flex className="presentations-header-actions">
            {user.driveToken ? (
              <Button variant="muvico-secondary" onClick={handleDriveOff}>
                Use MuViCo storage
              </Button>
            ) : (
              <LinkGoogleDriveButton onDriveLinked={handleDriveLinked} />
            )}
            <PresentationFormWrapper
              createPresentation={createPresentation}
              togglableRef={togglableRef}
              handleCancel={handleCancel}
            />
            <IconButton
              className="help-button"
              aria-label="Storage options help"
              icon={<QuestionIcon />}
              variant="ghost"
              size="lg"
              ml={1}
              onClick={onOpen}
              colorScheme="purple"
            />
            <StorageInfoModal isOpen={isOpen} onClose={onClose} user={user} />
          </Flex>
        }
      />
      <Dialog
        isOpen={isDialogOpen}
        onClose={handleCancelDelete}
        onConfirm={handleDialogConfirm}
        message="Are you sure you want to delete this presentation?"
      />
      <TutorialGuide
        steps={homePageTutorialSteps}
        isOpen={showHint}
        onClose={() => setShowHint(false)}
        storageKey={"hasSeenHelp_homepage"}
      />
    </Container>
  )
}

export default HomePage
