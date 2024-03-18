import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import {
  Container, Button, SimpleGrid, Box, GridItem, Image, Heading,
} from "@chakra-ui/react"

import presentationService from "../../services/presentation"
import VideoInformationTable from "./Controlpanel"
import CuesForm from "./Cues"

const PresentationPage = ({ userId }) => {
  const { id } = useParams()
  const [name, setName] = useState("")
  const [file, setFile] = useState(null)
  const [presentationInfo, setPresentationInfo] = useState(null)

  useEffect(() => {
    presentationService.get(id).then((presentation) => {
      if (presentation.user.toString() === userId) {
        setPresentationInfo(presentation)
      }
    })
  }, [id, userId])

  const addCue = async (cueData) => {
    const { index, cueName, screen, file, name } = cueData
    const formData = new FormData()
    formData.append("index", index)
    formData.append("cuename", cueName)
    formData.append("screen", screen)
    formData.append("image", file)
    formData.append("name", name)
    await presentationService.addFile(id, formData)

    setName("")
    setFile("")
  }

  const fileSelected = (event) => {
    const selected = event.target.files[0]
    setFile(selected)
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
          <CuesForm addCue={addCue}/>
          <VideoInformationTable data={presentationInfo.files} />
          <Box>
            <p>Cues: {presentationInfo.cues}</p>
            <SimpleGrid columns={1} gap={6}>
              {presentationInfo.files.map((mappedFile) => (
                <GridItem key={mappedFile._id}>
                  <Image src={mappedFile.url} alt={mappedFile.name} />
                  <Button onClick={() => removeFile(mappedFile._id)}>Remove file</Button>
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
