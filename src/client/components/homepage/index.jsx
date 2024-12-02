import {
  Container,
  SimpleGrid,
  Card,
  CardHeader,
  Button,
  GridItem,
  Heading,
  Text
} from "@chakra-ui/react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { useState, useEffect, useRef } from "react"
import presentationService from "../../services/presentations"
import presentation from "../../services/presentation"
import PresentationForm from "./presentationform"
import Togglable from "../utils/Togglable"
import randomLinearGradient from "../utils/randomGradient"
import { createFormData } from "../utils/formDataUtils"
import { useCustomToast } from "../utils/toastUtils"



export const PresentationsGrid = ({
  presentations,
  handlePresentationClick,
}) => (
  <>
    <Heading style={{ textAlign: "center", padding: "30px" }}>
      Presentations
    </Heading>

    <SimpleGrid columns={[1, 2, 3]} gap={5}>
      {presentations.map((presentation, index) => (
        <motion.div
          key={presentation.id}
          whileHover={{ scale: 1.05 }}
          onHoverStart={(e) => {}}
          onHoverEnd={(e) => {}}
        >
          <Card
            height="280px"
            onClick={() => handlePresentationClick(presentation.id)}
            cursor="pointer"
            justifyContent="center"
            textAlign="center"
            bg={randomLinearGradient()}
          >
            <CardHeader>
              <Heading
                size="md"
                color={"white"}
                style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.4)" }}
              >
                {presentation.name}
              </Heading>
            </CardHeader>
            {/* <CardBody>{assertImage(index)}</CardBody> */}
          </Card>
        </motion.div>
      ))}
    </SimpleGrid>
  </>
)

export const AdminControls = ({ isAdmin, navigate }) => (
  <>
    {" "}
    {isAdmin && (
      <>
        <Text fontSize="xl" fontWeight="bold">
          Admin controls
        </Text>
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
    const screens = [1,2,3,4]
    for (const screen of screens) {
    const formData = createFormData(0, `initial element for screen ${screen}`, screen, "/blank.png")
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
    }}}
  

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
      <CreatePresentation
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
