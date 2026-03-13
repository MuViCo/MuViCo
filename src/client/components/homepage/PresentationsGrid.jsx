import React, { useState, useEffect } from "react"
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
  Box,
} from "@chakra-ui/react"
import { DeleteIcon } from "@chakra-ui/icons"
import { motion } from "framer-motion"
import randomLinearGradient from "../utils/randomGradient"

const PresentationsGrid = ({
  presentations,
  handlePresentationClick,
  handleDeletePresentation,
}) => {
  const [viewMode, setViewMode] = useState(() => {
    // Initialize from localStorage, default to "grid"
    return localStorage.getItem("presentationsLayoutMode") || "grid"
  })

  // Save to localStorage whenever viewMode changes
  useEffect(() => {
    localStorage.setItem("presentationsLayoutMode", viewMode)
  }, [viewMode])

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
              <h2 style={{
                marginTop: "0.5em",
                fontSize: "0.9em",
                color: "rgba(255, 255, 255, 0.8)",
                textShadow: "1px 1px 3px rgba(0,0,0,0.3)",
                whiteSpace: "pre-wrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
              }}>
                {presentation.description || ""}
              </h2>
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
            <Flex align="center" justify="space-between">
              <Box flex="1">
                <Flex align="center">
                  <Heading
                    size="md"
                    color="white"
                    style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.4)" }}
                    mr={4}
                  >
                    {presentation.name}
                  </Heading>
                  <p style={{
                    fontSize: "1.2em",
                    color: "rgba(255, 255, 255, 0.8)",
                    textShadow: "1px 1px 3px rgba(0,0,0,0.3)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: "600px",
                    textAlign: "center",
                  }}>
                    {presentation.description || ""}
                  </p>
                </Flex>
              </Box>
            </Flex>
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
            <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M3 2C2.44772 2 2 2.44772 2 3V10C2 10.5523 2.44772 11 3 11H10C10.5523 11 11 10.5523 11 10V3C11 2.44772 10.5523 2 10 2H3ZM4 9V4H9V9H4Z" fill="#ffffff"/>
              <path fillRule="evenodd" clipRule="evenodd" d="M14 2C13.4477 2 13 2.44772 13 3V10C13 10.5523 13.4477 11 14 11H21C21.5523 11 22 10.5523 22 10V3C22 2.44772 21.5523 2 21 2H14ZM15 9V4H20V9H15Z" fill="#ffffff"/>
              <path fillRule="evenodd" clipRule="evenodd" d="M13 14C13 13.4477 13.4477 13 14 13H21C21.5523 13 22 13.4477 22 14V21C22 21.5523 21.5523 22 21 22H14C13.4477 22 13 21.5523 13 21V14ZM15 15V20H20V15H15Z" fill="#ffffff"/>
              <path fillRule="evenodd" clipRule="evenodd" d="M3 13C2.44772 13 2 13.4477 2 14V21C2 21.5523 2.44772 22 3 22H10C10.5523 22 11 21.5523 11 21V14C11 13.4477 10.5523 13 10 13H3ZM4 20V15H9V20H4Z" fill="#ffffff"/>
            </svg>
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
            <svg fill="#ffffff" width="24px" height="24px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="17" width="18" height="2" rx="1" ry="1"/>
              <rect x="3" y="11" width="18" height="2" rx="1" ry="1"/>
              <rect x="3" y="5" width="18" height="2" rx="1" ry="1"/>
            </svg>
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
