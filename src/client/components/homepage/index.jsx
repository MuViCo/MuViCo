import { Container, SimpleGrid, Button } from "@chakra-ui/react"
import { useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import presentationService from "../../services/presentations"
import PresentationForm from "./presentationform"
import Togglable from "../utils/Togglable"

const HomePage = ({ user }) => {
  const [presentations, setPresentations] = useState([])
  const navigate = useNavigate() // Add useNavigate hook

  useEffect(() => {
    presentationService
      .getAll()
      .then((usersPresentations) => setPresentations(usersPresentations))
  }, [])

  const createPresentation = async (presentationObject) => {
    try {
      await presentationService.create(presentationObject)
      const updatedPresentations = await presentationService.getAll()
      console.log("updatedPresentations", updatedPresentations)
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

  return (
    <Container maxW="container.lg">
      <div>
        {user.isAdmin && (
          <>
            <h2>Admin controls</h2>
            <SimpleGrid columns={[1, 2, 3]} mb={100} gap={6}>
              <Button onClick={() => navigate("/users")}>All users</Button>
              {/* <Button onClick={() => navigate("/media")}>All media</Button> */}
            </SimpleGrid>
          </>
        )}
        <SimpleGrid columns={[1, 2, 3]} gap={1}>
          <Togglable buttonLabel="new presentation" exitLabel="cancel">
            <PresentationForm createPresentation={createPresentation} />
          </Togglable>
          <Button onClick={() => handleConnectionsClick()}>Connections</Button>
        </SimpleGrid>
        <span>&nbsp;</span>
        <h2>Presentations</h2>
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
      </div>
    </Container>
  )
}

export default HomePage
