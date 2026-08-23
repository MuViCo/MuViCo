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

import type { Presentation } from "../../types"

const UserPresentations = () => {
  const { id } = useParams()
  const [presentations, setPresentations] = useState<Presentation[]>([])
  const navigate = useNavigate()
  const handlePresentationClick = (userId: string) => {
    navigate(`/presentation/${userId}`)
  }
  useEffect(() => {
    const getPresentationData = async () => {
      // useParams types every param as optional; this route only renders
      // under /userspresentations/:id, so id is always present.
      const updatedPresentations = await adminService.usersPresentations(
        id as string
      )
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
