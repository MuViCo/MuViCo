import { Container } from "@chakra-ui/react"
import { useNavigate } from "react-router-dom"
import { useState, useEffect, useRef } from "react"
import presentationService from "../../services/presentations"
import presentation from "../../services/presentation"
import AdminControls from "./AdminControls"
import PresentationsGrid from "./PresentationsGrid"
import CreatePresentationContainer from "./CreatePresentationContainer"
import { createFormData } from "../utils/formDataUtils"
import { useCustomToast } from "../utils/toastUtils"

const HomePage = ({ user }) => {
  const [presentations, setPresentations] = useState([])
  const navigate = useNavigate()
  const togglableRef = useRef(null)
  const showToast = useCustomToast()

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

  const addBlankCue = async (presentationId) => {
    const screens = [1, 2, 3, 4]
    for (const screen of screens) {
      const formData = createFormData(
        0,
        `initial element for screen ${screen}`,
        screen,
        "/blank.png"
      )
      try {
        await presentation.addCue(presentationId, formData)
        showToast({
          title: "Element added",
          description: `Initial element added to screen ${screen}`,
          status: "success",
        })
      } catch (error) {
        const errorMessage = error.message || "An error occurred"
        console.error("Error adding initial element:", error)
        showToast({
          title: "Error",
          description: errorMessage,
          status: "error",
        })
      }
    }
  }

  const createPresentation = async (presentationObject) => {
    try {
      await presentationService.create(presentationObject)
      const updatedPresentations = await presentationService.getAll()
      setPresentations(updatedPresentations)
      const presentationId =
        updatedPresentations[updatedPresentations.length - 1].id

      await addBlankCue(presentationId)
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
      <CreatePresentationContainer
        createPresentation={createPresentation}
        togglableRef={togglableRef}
        handleCancel={handleCancel}
      />
      <PresentationsGrid
        presentations={presentations}
        handlePresentationClick={handlePresentationClick}
      />
    </Container>
  )
}

export default HomePage
