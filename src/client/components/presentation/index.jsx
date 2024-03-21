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

import presentationService from "../../services/presentation"
import CuesForm from "./Cues"

export const PresentationCues = ({ presentation, removeCue }) => (
  <>
    <Box py={4}>
      <Heading size="md">Cues:</Heading>
      <SimpleGrid columns={2} gap={6}>
        {presentation.cues.map((cue) => (
          <GridItem key={cue._id}>
            <p>Index: {cue.index}</p>
            <p>Name: {cue.name}</p>
            <p>Screen: {cue.screen}</p>
            <p>File: {cue.file.name}</p>
            <Button onClick={() => removeCue(cue._id)}>Remove cue</Button>
          </GridItem>
        ))}
      </SimpleGrid>
    </Box>
  </>
)

const PresentationPage = ({ userId }) => {
  const { id } = useParams()

  const [presentationInfo, setPresentationInfo] = useState(null)

  const navigate = useNavigate()

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

  return (
    <Container>
      {presentationInfo && (
        <>
          <Heading mb={8}>{presentationInfo.name}</Heading>
          <CuesForm addCue={addCue} />
          <PresentationCues
            presentation={presentationInfo}
            removeCue={removeCue}
          />
          <Button onClick={() => deletePresentation()}>
            Delete presentation
          </Button>
        </>
      )}
    </Container>
  )
}

export default PresentationPage
