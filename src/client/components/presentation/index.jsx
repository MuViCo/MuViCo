import {
  Container,
  Button,
  SimpleGrid,
  Box,
  GridItem,
  Image,
  Link,
  Heading,
} from "@chakra-ui/react"
import { Link as RouterLink, useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import presentationService from "../../services/presentation"
import VideoInformationTable from "./Controlpanel"
import CuesForm from "./Cues"

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
              {presentationInfo.files.map((mappedFile, index) => (
                <GridItem key={mappedFile._id}>
                  <Image src={mappedFile.url} alt={mappedFile.name} />
                  <Button onClick={() => removeFile(mappedFile._id)}>
                    Remove file
                  </Button>
                  {index === 0 &&
                    console.log("URL of the first photo:", mappedFile.url)}
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
