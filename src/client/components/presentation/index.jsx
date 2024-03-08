import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Container, Button, SimpleGrid, Box, GridItem } from "@chakra-ui/react"

import presentationService from "../../services/presentation"
import InputField from "./InputField.jsx"

export const PresentationPage = () => {
  const { id } = useParams()
  const [presentationInfo, setPresentationInfo] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    presentationService.get(id).then((info) => setPresentationInfo(info))
  }, [id])

  const removePresentationOnClick = (presentationId) => {
    presentationService.remove(presentationId)
    navigate("/home")
  }

  const onAddFile = async ({ formData }) => {
    const updatedPresentation = await presentationService.addFile(
      id,
      formData,
    )
    setPresentationInfo(updatedPresentation)
  }

  const onRemoveFile = async (fileId) => {
    const updatedPresentation = await presentationService.removeVideo(
      id,
      fileId
    )
    setPresentationInfo(updatedPresentation)
  }

  return (
    <Container>
      {presentationInfo && (
        <Box>
          <p>Name: {presentationInfo.name}</p>
          <p>Cues: {presentationInfo.cues}</p>
          {/* <Body /> */}
          <InputField onAdd={onAddFile} />
          <SimpleGrid columns={[1]} gap={6}>
            {presentationInfo.files.map((file) => (
              <GridItem key={file._id}>
              </GridItem>
            ))}
          </SimpleGrid>
        </Box>
      )}
      <Button onClick={() => removePresentationOnClick(id)}>
        Remove presentation
      </Button>
    </Container>
  )
}

export default PresentationPage
