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
} from "@chakra-ui/react"
import { InfoOutlineIcon } from "@chakra-ui/icons"
import { useNavigate } from "react-router-dom"
import { useState, useEffect, useRef } from "react"
import axios from "axios"

import presentationService from "../../services/presentations"
import AdminControls from "./AdminControls"
import PresentationsGrid from "./PresentationsGrid"
import PresentationFormWrapper from "./PresentationFormWrapper"
import LinkGoogleDriveButton from "./LinkGoogleDriveButton"
import addInitialElements from "../utils/addInitialElements"
import { useCustomToast } from "../utils/toastUtils"
import getToken from "../../auth"

const HomePage = ({ user, setUser }) => {
  const [presentations, setPresentations] = useState([])
  const [driveLinked, setDriveLinked] = useState(false)
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

  useEffect(() => {
    setDriveLinked(!!user.driveToken)
  }, [user.driveToken])

  console.log("is drive linked", driveLinked)

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
    setDriveLinked(true)

    const updatedPresentations = await presentationService.getAll()
    setPresentations(updatedPresentations)
  }

  const handleDriveOff = async () => {
    try {
      const userToken = getToken()
      window.localStorage.removeItem("driveAccessToken")

      const currentUser = JSON.parse(window.localStorage.getItem("user"))
      const updatedUser = { ...currentUser, driveToken: null }
      window.localStorage.setItem("user", JSON.stringify(updatedUser))

      await axios.post(
        "/api/users/unlink-drive",
        {},
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        }
      )

      setUser(updatedUser)
      setDriveLinked(false)

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

  console.log("user", user)

  return (
    <Container maxW="container.lg">
      <AdminControls isAdmin={user.isAdmin} navigate={navigate} />
      <Container
        display="flex"
        justify="space-between"
        p={4}
        maxW="container.lg"
        wrap="wrap"
      >
        <PresentationFormWrapper
          createPresentation={createPresentation}
          togglableRef={togglableRef}
          handleCancel={handleCancel}
        />
        {user.driveToken ? (
          <Button onClick={handleDriveOff}>Link AWS</Button>
        ) : (
          <LinkGoogleDriveButton onDriveLinked={handleDriveLinked} />
        )}

        {/* Info Button triggering the Modal */}
        <Button variant="ghost" size="s" ml={2} mb={2} onClick={onOpen}>
          <InfoOutlineIcon />
        </Button>

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
                  You are currently using <strong> Google Drive</strong>
                </Text>
              ) : (
                <Text fontStyle="italic" color="purple.400">
                  You are currently using
                  <strong> AWS</strong>
                </Text>
              )}
              <br></br>
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
                  Enjoy unlimited storage capacity, so you can store as many
                  files as you need without any space concerns.
                </ListItem>
                <ListItem>
                  <Text as="span" fontWeight="bold">
                    Seamless Experience:
                  </Text>{" "}
                  Manage and access your files easily through the familiar
                  Google Drive interface.
                </ListItem>
              </UnorderedList>

              <Text fontWeight="bold">AWS Storage Provided by the App</Text>
              <Text>Managed Storage (Up to 50 MB):</Text>
              <UnorderedList ml={4} mb={2}>
                <ListItem>
                  <Text as="span" fontWeight="bold">
                    App-Managed Storage:
                  </Text>{" "}
                  With this option, the app provides dedicated AWS storage,
                  meaning you don’t have to link or manage your own AWS account.
                </ListItem>
                <ListItem>
                  <Text as="span" fontWeight="bold">
                    Storage Cap:
                  </Text>{" "}
                  This provided storage option comes with a fixed limit of 50
                  MB, ideal for minimal file storage or short-term data needs.
                </ListItem>
                <ListItem>
                  <Text as="span" fontWeight="bold">
                    Optimized for Efficiency:
                  </Text>{" "}
                  Benefit from the robust and secure AWS infrastructure managed
                  entirely by the app within the given limit.
                </ListItem>
              </UnorderedList>

              <Text>
                <Text as="span" fontWeight="bold">
                  Note:
                </Text>{" "}
                Choose Google Drive if you require extensive storage capacity.
                Select AWS storage if your storage needs are minimal or for
                temporary data handling.
              </Text>
            </ModalBody>
            <ModalFooter>
              <Button onClick={onClose}>Close</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Container>

      <PresentationsGrid
        presentations={presentations}
        handlePresentationClick={handlePresentationClick}
      />
    </Container>
  )
}

export default HomePage
