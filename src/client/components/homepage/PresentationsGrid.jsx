import { SimpleGrid, Card, CardHeader, Heading } from "@chakra-ui/react"
import { motion } from "framer-motion"
import randomLinearGradient from "../utils/randomGradient"

const PresentationsGrid = ({ presentations, handlePresentationClick }) => (
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

export default PresentationsGrid
