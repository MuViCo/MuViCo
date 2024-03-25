import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  Container,
  Button,
  SimpleGrid,
  Box,
  GridItem,
  Image,
  Heading,
} from "@chakra-ui/react"
import NewWindow from "react-new-window"

import presentationService from "../../services/presentation"
import CuesForm from "./Cues"

export const PresentationCues = ({ presentation, removeCue }) => (
  <>
    <p>Cues:</p>
    <Box>
      <SimpleGrid columns={2} gap={6}>
        {presentation.cues.map((cue) => (
          <GridItem key={cue._id}>
            <p>Index: {cue.index}</p>
            <p>Name: {cue.name}</p>
            <p>Screen: {cue.screen}</p>
            <p>File: {cue.file.name}</p>
            <Button onClick={() => removeCue(cue._id)}>
              Remove cue
            </Button>
          </GridItem>
        ))}
      </SimpleGrid>
    </Box>
  </>
)

const PresentationPage = ({ userId }) => {
  const { id } = useParams()

  const [showMode, setShowMode] = useState(false)

  const [presentationInfo, setPresentationInfo] = useState(null)

  const navigate = useNavigate()

  const handleShowMode = () => {
    setShowMode(!showMode)
  }

  const handleNewWindow = (fileUrl) => {
    console.log("opening new window", fileUrl)
    return null
  }

  useEffect(() => {
    presentationService
      .get(id)
      .then((presentation) => {
        setPresentationInfo(presentation)
      })
      .catch((error) => {
        navigate("/home")
      })
  }, [id, userId, navigate])

  const addCue = async (cueData) => {
    const { index, cueName, screen, file, fileName } = cueData
    const formData = new FormData()
    formData.append("index", index)
    formData.append("cueName", cueName)
    formData.append("screen", screen)
    formData.append("image", file)
    formData.append("fileName", fileName)
    await presentationService.addCue(id, formData)
  }

  const removeCue = async (cueId) => {
    const updatedPresentation = await presentationService.removeCue(id, cueId)
    setPresentationInfo(updatedPresentation)
  }

  const deletePresentation = async () => {
    await presentationService.remove(id)
    navigate("/home")
  }

  if (!showMode) {
    return (
      <Container>
        {presentationInfo && (
          <>
            <Heading>{presentationInfo.name}</Heading>
            <CuesForm addCue={addCue} />
            <PresentationCues presentation={presentationInfo} removeCue={removeCue} />
            <Button onClick={() => handleShowMode()}>
              {showMode ? "Edit mode" : "Show mode"}</Button>
            <Button onClick={() => deletePresentation()}>Delete presentation</Button>
          </>
        )}
      </Container >
    )
  }
  return (
      <Container>
        {presentationInfo && (
          <>
            <Heading>{presentationInfo.name}</Heading>
            <PresentationCues presentation={presentationInfo} removeCue={removeCue} />
            <Button onClick={() => handleShowMode()}>
              {showMode ? "Edit mode" : "Show mode"}</Button>
            <Button onClick={() => handleNewWindow(presentationInfo.cues[0].file.url)}>New Screen</Button>
            <NewWindow url={presentationInfo.cues[0].file.url}>Content</NewWindow>
          </>
        )}
      </Container>
  )
}

export default PresentationPage
