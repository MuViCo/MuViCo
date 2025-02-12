import { Container } from "@chakra-ui/react"
import { useNavigate } from "react-router-dom"
import { useState, useEffect, useRef } from "react"
import presentationService from "../../services/presentations"
import AdminControls from "./AdminControls"
import PresentationsGrid from "./PresentationsGrid"
import CreatePresentationContainer from "./CreatePresentationContainer"

const HomePage = ({ user }) => {
  const [presentations, setPresentations] = useState([])
  const navigate = useNavigate()
  const togglableRef = useRef(null)

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

      navigate(`/presentation/${presentationId}`, {
        state: { isJustCreated: true },
      })
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
