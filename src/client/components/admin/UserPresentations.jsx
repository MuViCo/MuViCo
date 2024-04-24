import {
  Heading,
  SimpleGrid,
  Card,
  CardHeader,
  Container,
} from "@chakra-ui/react"
import { motion } from "framer-motion"
import { useNavigate, useParams } from "react-router-dom"
import { useEffect, useState } from "react"
import randomLinearGradient from "../utils/randomGradient"
import adminService from "../../services/admin"

const UserPresentations = () => {
  const { id } = useParams()
  const [presentations, setPresentations] = useState([])
  const navigate = useNavigate()
  const handlePresentationClick = (userId) => {
    navigate(`/presentation/${userId}`)
  }
  useEffect(() => {
    const getPresentationData = async () => {
      const updatedPresentations = await adminService.usersPresentations(id)
      setPresentations(updatedPresentations)
    }
    getPresentationData()
  }, [id])
  return (
    <>
      <Container maxW="container.lg">
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
      </Container>
    </>
  )
}

export default UserPresentations
