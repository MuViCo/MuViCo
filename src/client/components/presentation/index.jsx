import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
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
import VideoInformationTable from "./Controlpanel"
import CuesForm from "./Cues"

const PresentationPage = ({ userId }) => {
  const { id } = useParams()

  const [presentationInfo, setPresentationInfo] = useState(null)

  useEffect(() => {
    presentationService.get(id).then((presentation) => {
      if (presentation.user.toString() === userId) {
        setPresentationInfo(presentation)
      }
    })
  }, [id, userId])

  const addCue = async (cueData) => {
    const { index, cueName, screen, file, fileName } = cueData
    const formData = new FormData()
    formData.append("index", index)
    formData.append("cueName", cueName)
    formData.append("screen", screen)
    formData.append("image", file)
    formData.append("fileName", fileName)
    await presentationService.addFile(id, formData)
  }

  const removeFile = async (fileId) => {
    const updatedPresentation = await presentationService.removeFile(id, fileId)
    setPresentationInfo(updatedPresentation)
  }

  return (
    <Container>
      {presentationInfo && (
        <>
          <Heading>{presentationInfo.name}</Heading>
          <CuesForm addCue={addCue} />
          <Box>
            <p>Cues:</p>
            <Box>
              <SimpleGrid columns={2} gap={6}>
                {presentationInfo.cues.map((cue) => (
                  <GridItem key={cue._id}>
                    <p>Index: {cue.index}</p>
                    <p>Name: {cue.name}</p>
                    <p>Screen: {cue.screen}</p>
                    <p>File: {cue.fileName}</p>
                  </GridItem>
                ))}
              </SimpleGrid>
            </Box>
            <SimpleGrid columns={1} gap={6}>
              {presentationInfo.files.map((mappedFile) => (
                <GridItem key={mappedFile._id}>
                  <Image src={mappedFile.url} alt={mappedFile.name} />
                  <Button onClick={() => removeFile(mappedFile._id)}>
                    Remove file
                  </Button>
                </GridItem>
              ))}
            </SimpleGrid>
          </Box>
        </>
      )}
    </Container>
  )
}

export default PresentationPage
