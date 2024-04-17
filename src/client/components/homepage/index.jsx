import {
  Container,
  SimpleGrid,
  Button,
  Grid,
  GridItem,
  Heading,
} from "@chakra-ui/react"
import { useNavigate } from "react-router-dom"
import { useState, useEffect, useRef } from "react"
import presentationService from "../../services/presentations"
import PresentationForm from "./presentationform"
import Togglable from "../utils/Togglable"

export const PresentationsGrid = ({
  presentations,
  handlePresentationClick,
}) => (
  <>
    <Heading>Presentations</Heading>
    <SimpleGrid columns={[1, 2, 3]} gap={5}>
      {presentations.map((presentation) => (
        <Button
          key={presentation.id}
          onClick={() => handlePresentationClick(presentation.id)}
          height="50px"
          width="200px"
        // flexDirection="column"
        // justifyContent="flex-start"
        // alignItems="center"
        // paddingY="20px"
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
}) => (
  <SimpleGrid columns={[1, 2, 3]} gap={10}>
    <GridItem>
      <Togglable
        buttonLabel="New presentation"
        exitLabel="cancel"
        ref={togglableRef}
      >
        <PresentationForm
          createPresentation={createPresentation}
          onCancel={handleCancel}
        />
      </Togglable>
    </GridItem>
  </SimpleGrid>
)

const HomePage = ({ user }) => {
  const [presentations, setPresentations] = useState([])
  const navigate = useNavigate()
  const togglableRef = useRef(null)
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
