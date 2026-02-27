import React, { useState } from "react"
import {
  SimpleGrid,
  Card,
  CardHeader,
  Heading,
  IconButton,
  Button,
  HStack,
  Flex,
  List,
  ListItem,
} from "@chakra-ui/react"
import { DeleteIcon } from "@chakra-ui/icons"
import { motion } from "framer-motion"
import randomLinearGradient from "../utils/randomGradient"

const PresentationsGrid = ({
  presentations,
  handlePresentationClick,
  handleDeletePresentation,
}) => {
  const [viewMode, setViewMode] = useState("grid")

  const renderGrid = () => (
    <SimpleGrid columns={[1, 2, 3]} gap={5} id="presentations-grid" minH="400px">
      {presentations.map((presentation) => (
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
            <IconButton
              icon={<DeleteIcon />}
              size="md"
              position="absolute"
              _hover={{ bg: "red.500", color: "white" }}
              backgroundColor="red.300"
              draggable={false}
              zIndex="10"
              top="4px"
              right="4px"
              aria-label={"Delete presentation"}
              title="Delete presentation"
              onClick={(e) => {
                e.stopPropagation()
                handleDeletePresentation(presentation.id)
              }}
            />
          </Card>
        </motion.div>
      ))}
    </SimpleGrid>
  )

  const renderList = () => (
    <List id="presentations-grid" spacing={3} minH="400px">
      {presentations.map((presentation) => (
        <motion.div
          key={presentation.id}
          whileHover={{ scale: 1.02 }}
          style={{ originX: 0 }}
        >
          <ListItem
            p={4}
            borderWidth="1px"
            borderRadius="md"
            cursor="pointer"
            bg={randomLinearGradient()}
            onClick={() => handlePresentationClick(presentation.id)}
            position="relative"
          >
            <Heading
              size="md"
              color="white"
              style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.4)" }}
            >
              {presentation.name}
            </Heading>
            <IconButton
              icon={<DeleteIcon />}
              size="sm"
              position="absolute"
              _hover={{ bg: "red.500", color: "white" }}
              backgroundColor="red.300"
              draggable={false}
              zIndex="10"
              top="4px"
              right="4px"
              aria-label={"Delete presentation"}
              title="Delete presentation"
              onClick={(e) => {
                e.stopPropagation()
                handleDeletePresentation(presentation.id)
              }}
            />
          </ListItem>
        </motion.div>
      ))}
    </List>
  )

  return (
    <>
      {/* heading and toggle buttons on same row */}
      <Flex
        justify="space-between"
        align="center"
        p={6}
        gap={4}
        flexWrap="wrap"
      >
        <Heading>Presentations</Heading>

        {/* view mode toggle buttons */}
        <HStack spacing={2}>
          <Button
            onClick={() => setViewMode("grid")}
            isActive={viewMode === "grid"}
            colorScheme="purple"
            variant={viewMode === "grid" ? "solid" : "outline"}
            px={6}
            py={2}
            fontSize="md"
            fontWeight="semibold"
            borderRadius="lg"
            transition="all 0.2s"
            _hover={{
              transform: "translateY(-2px)",
              boxShadow: "lg",
            }}
            data-testid="grid-button"
          >
            📊 
          </Button>
          <Button
            onClick={() => setViewMode("list")}
            isActive={viewMode === "list"}
            colorScheme="purple"
            variant={viewMode === "list" ? "solid" : "outline"}
            px={6}
            py={2}
            fontSize="md"
            fontWeight="semibold"
            borderRadius="lg"
            transition="all 0.2s"
            _hover={{
              transform: "translateY(-2px)",
              boxShadow: "lg",
            }}
            data-testid="list-button"
          >
            📋
          </Button>
        </HStack>
      </Flex>

      {presentations.length === 0 && (
        <Heading size="md" textAlign="center" color="gray.500" mt="50px">
          No presentations found. Create a new presentation to get started!
        </Heading>
      )}

      {viewMode === "grid" ? renderGrid() : renderList()}
    </>
  )
}

export default PresentationsGrid
