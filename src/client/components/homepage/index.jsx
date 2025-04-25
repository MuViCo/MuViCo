import {
  Button,
  Container,
  Box,
  Text,
  ListItem,
  UnorderedList,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
  IconButton,
} from "@chakra-ui/react"
import { QuestionIcon } from "@chakra-ui/icons"
import { useNavigate } from "react-router-dom"
import { useState, useEffect, useRef } from "react"

import presentationService from "../../services/presentations"
import userService from "../../services/users"
import AdminControls from "./AdminControls"
import PresentationsGrid from "./PresentationsGrid"
import PresentationFormWrapper from "./PresentationFormWrapper"
import LinkGoogleDriveButton from "./LinkGoogleDriveButton"
import addInitialElements from "../utils/addInitialElements"
import { useCustomToast } from "../utils/toastUtils"

const HomePage = ({ user, setUser }) => {
  const [presentations, setPresentations] = useState([])
  const navigate = useNavigate()
  const togglableRef = useRef(null)
  const showToast = useCustomToast()
  const { isOpen, onOpen, onClose } = useDisclosure()

  useEffect(() => {
    const getPresentationData = async () => {
      try {
        const updatedPresentations = await presentationService.getAll()
        setPresentations(updatedPresentations)
      } catch (error) {
        if (error.response && error.response.status === 401) {
          navigate("/")
        }
      }
    }
    getPresentationData()
  }, [navigate])

  const createPresentation = async (presentationObject) => {
    try {
      await presentationService.create(presentationObject)
      const updatedPresentations = await presentationService.getAll()
      setPresentations(updatedPresentations)
      const presentationId =
        updatedPresentations[updatedPresentations.length - 1].id

      await addInitialElements(presentationId, showToast)
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

  const handleDriveLinked = async (updatedUser) => {
    setUser(updatedUser)

    const updatedPresentations = await presentationService.getAll()
    setPresentations(updatedPresentations)
  }

  const handleDriveOff = async () => {
    try {
      window.localStorage.removeItem("driveAccessToken")

      const currentUser = JSON.parse(window.localStorage.getItem("user"))
      const updatedUser = { ...currentUser, driveToken: null }
      window.localStorage.setItem("user", JSON.stringify(updatedUser))

      await userService.unlinkDrive()

      setUser(updatedUser)

      const updatedPresentations = await presentationService.getAll()
      setPresentations(updatedPresentations)

      showToast({
        title: "AWS linked successfully",
        status: "success",
      })
    } catch (error) {
      console.error("Error linking AWS:", error)
      showToast({
        title: "Failed to link AWS",
        status: "error",
      })
    }
  }

  return (
    <Container maxW="container.lg">
      <AdminControls isAdmin={user.isAdmin} navigate={navigate} />

      {/* Responsive layout: stack on narrow screens, row on wider ones */}
      <Box
        display="flex"
        flexDirection={["column", "row"]}
        alignItems={["flex-start", "center"]}
        justifyContent="space-between"
        p={4}
        gap={4} // Provides spacing when stacked
      >
        {/* Left side: Presentation form */}
        <PresentationFormWrapper
          createPresentation={createPresentation}
          togglableRef={togglableRef}
          handleCancel={handleCancel}
        />

        {/* Right side: Drive/AWS button and Info button */}
        <Box display="flex" alignItems="center" gap={1}>
          {user.driveToken ? (
            <Button onClick={handleDriveOff}>Link AWS</Button>
          ) : (
            <LinkGoogleDriveButton onDriveLinked={handleDriveLinked} />
          )}
          <IconButton
            icon={<QuestionIcon />}
            variant="ghost"
            size="lg"
            ml={1}
            onClick={onOpen}
            colorScheme="purple"
          />
        </Box>
      </Box>

      {/* Modal displaying storage options */}
      <Modal isCentered isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalOverlay
          bg="none"
          backdropFilter="auto"
          backdropInvert="0%"
          backdropBlur="10px"
        />
        <ModalContent>
          <ModalHeader>Storage Options</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {user.driveToken ? (
              <Text fontStyle="italic" color="purple.400">
                You are currently using <strong>Google Drive</strong>
              </Text>
            ) : (
              <Text fontStyle="italic" color="purple.400">
                You are currently using <strong>AWS</strong>
              </Text>
            )}
            <br />
            <Text mb={2}>
              Our app offers two distinct storage solutions. Please review the
              options below and choose the one that best fits your needs.
            </Text>

            <Text fontWeight="bold">Google Drive Integration</Text>
            <Text>Unlimited Storage:</Text>
            <UnorderedList ml={4} mb={2}>
              <ListItem>
                <Text as="span" fontWeight="bold">
                  Link Your Account:
                </Text>{" "}
                Connect your Google Drive account directly to the app.
              </ListItem>
              <ListItem>
                <Text as="span" fontWeight="bold">
                  No Storage Limits:
                </Text>{" "}
                Enjoy unlimited storage capacity, so you can store as many files
                as you need without any space concerns.
              </ListItem>
              <ListItem>
                <Text as="span" fontWeight="bold">
                  Seamless Experience:
                </Text>{" "}
                Manage and access your files easily through the familiar Google
                Drive interface.
              </ListItem>
            </UnorderedList>

            <Text fontWeight="bold">AWS Storage Provided by the App</Text>
            <Text>Managed Storage (Up to 50 MB):</Text>
            <UnorderedList ml={4} mb={2}>
              <ListItem>
                <Text as="span" fontWeight="bold">
                  App-Managed Storage:
                </Text>{" "}
                The app provides dedicated AWS storage, meaning you don’t have
                to link or manage your own AWS account.
              </ListItem>
              <ListItem>
                <Text as="span" fontWeight="bold">
                  Storage Cap:
                </Text>{" "}
                This provided storage option comes with a limit of 50 MB,
                suitable for minimal file storage or short-term data.
              </ListItem>
              <ListItem>
                <Text as="span" fontWeight="bold">
                  Optimized for Efficiency:
                </Text>{" "}
                Benefit from the robust and secure AWS infrastructure managed by
                the app within the given limit.
              </ListItem>
            </UnorderedList>

            <Text mb={2}>
              <Text as="span" fontWeight="bold">
                Note:
              </Text>{" "}
              Choose Google Drive if you require extensive storage capacity.
              Select AWS storage if your storage needs are minimal or for
              temporary data handling.
            </Text>

            <Text fontSize="s" color="gray.400">
              <Text as="span" fontWeight="bold">
                Important:
              </Text>{" "}
              There will be separate presentations for AWS and Google Drive.
              When you link Google Drive, you will only see the presentations
              you created while using Google Drive. When you link AWS, you will
              only see the presentations you added when using AWS.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Presentations grid below */}
      <PresentationsGrid
        presentations={presentations}
        handlePresentationClick={handlePresentationClick}
      />
    </Container>
  )
}

export default HomePage
