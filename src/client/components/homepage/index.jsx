import {
  Container,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
  Grid,
  GridItem,
  Image,
  Heading,
  Center,
} from "@chakra-ui/react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { useState, useEffect, useRef } from "react"
import presentationService from "../../services/presentations"
import PresentationForm from "./presentationform"
import Togglable from "../utils/Togglable"

// Function to generate random color values within a certain range, focusing on darker shades of purple
const randomColor = () => {
  const red = 200 // R: 218
  const blue = 255 // B: 255
  const green = Math.floor(Math.random() * 175) // G: Random value between 0 and 100
  return `rgba(${red}, ${green}, ${blue}, 1)`
}

// Function to generate a random linear gradient
const randomLinearGradient = () => {
  const color1 = randomColor()
  const color2 = randomColor()
  return `linear-gradient(0deg, ${color1} 0%, ${color2} 100%)`
}
export const PresentationsGrid = ({
  presentations,
  handlePresentationClick,
}) => (
	<>
		<h1 align="center" style={{ padding: "30px" }}>
			Presentations
		</h1>
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
