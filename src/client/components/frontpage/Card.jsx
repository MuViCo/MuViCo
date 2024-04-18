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
  Image,
} from "@chakra-ui/react"
import { motion } from "framer-motion"

const InfoCard = ({ title, description, modalTitle, modalDesc, modalSvg }) => {
  const { isOpen, onOpen, onClose } = useDisclosure()

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      onHoverStart={(e) => {}}
      onHoverEnd={(e) => {}}
    >
      <Card height="280">
        <CardHeader>
          <Heading size="md">{title}</Heading>
        </CardHeader>
        <CardBody>
          <Text>{description}</Text>
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
          <ModalHeader>{modalTitle}</ModalHeader>
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
