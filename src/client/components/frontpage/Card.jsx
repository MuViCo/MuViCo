import React from "react"
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Heading,
  Text,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Box,
  useColorModeValue,
} from "@chakra-ui/react"
import { motion } from "framer-motion"

const InfoCard = ({ title, description, modalTitle, modalDesc, modalSvg }) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const underlineColor = useColorModeValue(
    "#9D4EDD",
    "#E9B8FF"
  )

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      onHoverStart={(e) => {}}
      onHoverEnd={(e) => {}}
    >
      <Card height="280">
        <CardHeader pt={6} pb={0}>
          <Heading fontSize="17px" fontFamily="'Zalando Sans Expanded', sans-serif">{title}</Heading>
          <Box 
            height="2px" 
            bg={underlineColor}
            mt={5}
          />
        </CardHeader>
        <CardBody>
          <Text fontSize="14px" fontFamily="'Zalando Sans Expanded', sans-serif">{description}</Text>
        </CardBody>
        <CardFooter justifyContent="center">
          <Button
            colorScheme="purple"
            variant="outline"
            px={6}
            onClick={onOpen}
          >
            Learn more
          </Button>
        </CardFooter>
      </Card>
      <Modal isCentered isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalOverlay
          bg="none"
          backdropFilter="auto"
          backdropInvert="0%"
          backdropBlur="10px"
        />
        <ModalContent>
          <ModalHeader fontFamily="'Zalando Sans Expanded', sans-serif">{modalTitle}</ModalHeader>
          <ModalCloseButton />
          <ModalBody alignContent="center">
            <Text fontStyle="italic">{modalDesc}</Text>
            <br />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5 }}
              style={{ display: "flex", justifyContent: "center" }}
            >
              {modalSvg}
            </motion.div>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </motion.div>
  )
}

export default InfoCard
