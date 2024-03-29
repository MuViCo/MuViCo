import { Container, SimpleGrid, Button, Heading } from "@chakra-ui/react"
import { useNavigate } from "react-router-dom"
import { useState, useEffect, useRef } from "react" // Add useRef
import presentationService from "../../services/presentations"
import PresentationForm from "./presentationform"
import Togglable from "../utils/Togglable"

export const PresentationsGrid = ({
  presentations,
  handlePresentationClick,
}) => (
  <>
    <Heading>Presentations</Heading>
    <SimpleGrid columns={[1, 2, 3]} gap={6}>
      {presentations.map((presentation) => (
        <Button
          key={presentation.id}
          onClick={() => handlePresentationClick(presentation.id)}
        >
          {presentation.name}
        </Button>
      ))}
    </SimpleGrid>
  </>
)

export const AdminControls = ({ isAdmin, navigate }) => (
  <>
    {" "}
    {isAdmin && (
      <>
        <h2>Admin controls</h2>
        <SimpleGrid columns={[1, 2, 3]} mb={100} gap={6}>
          <Button onClick={() => navigate("/users")}>All users</Button>
        </SimpleGrid>
      </>
    )}
  </>
)

export const CreatePresentation = ({
  createPresentation,
  togglableRef,
  handleCancel,
  handleConnectionsClick,
}) => (
  <SimpleGrid columns={[1, 2, 3]} gap={1}>
    <Togglable
      buttonLabel="new presentation"
      exitLabel="cancel"
      ref={togglableRef}
    >
      <PresentationForm
        createPresentation={createPresentation}
        onCancel={handleCancel}
      />
    </Togglable>
    <Button onClick={() => handleConnectionsClick()}>Connections</Button>
  </SimpleGrid>
)

const HomePage = ({ user }) => {
  const [presentations, setPresentations] = useState([])
  const navigate = useNavigate()
  const togglableRef = useRef(null) // Create a ref for Togglable component

  useEffect(() => {
    const getPresentationData = async () => {
      const updatedPresentations = await presentationService.getAll()
      setPresentations(updatedPresentations)
    }
    getPresentationData()
  }, [])

  const createPresentation = async (presentationObject) => {
    try {
      await presentationService.create(presentationObject)
      const updatedPresentations = await presentationService.getAll()
      setPresentations(updatedPresentations)
      const presentationId =
        updatedPresentations[updatedPresentations.length - 1].id
      navigate(`/presentation/${presentationId}`)
    } catch (error) {
      console.error("Error creating presentation:", error)
    }
  }

  const handlePresentationClick = (presentationId) => {
    navigate(`/presentation/${presentationId}`)
  }

  const handleConnectionsClick = () => {
    navigate("/connections")
  }

  const handleCancel = () => {
    togglableRef.current.toggleVisibility()
  }

  return (
    <Container maxW="container.lg">
      <div>
        <AdminControls isAdmin={user.isAdmin} navigate={navigate} />
        <CreatePresentation
          createPresentation={createPresentation}
          togglableRef={togglableRef}
          handleCancel={handleCancel}
          handleConnectionsClick={handleConnectionsClick}
        />
        <PresentationsGrid
          presentations={presentations}
          handlePresentationClick={handlePresentationClick}
        />
      </div>
    </Container>
  )
}

export default HomePage
