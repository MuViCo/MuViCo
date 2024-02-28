import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Container, Button, SimpleGrid, Box, GridItem } from "@chakra-ui/react"

import presentationService from "../../services/presentation"
import VideoEmbed from "./VideoEmbed.jsx"
import InputField from "./InputField.jsx"
import Body from "../photopage/Body.jsx"

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

  const onAddVideo = async ({ videoName, videoUrl }) => {
    const updatedPresentation = await presentationService.addVideo(
      id,
      videoName,
      videoUrl
    )
    setPresentationInfo(updatedPresentation)
  }

  const onRemoveVideo = async (videoId) => {
    const updatedPresentation = await presentationService.removeVideo(
      id,
      videoId
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
          <InputField onAdd={onAddVideo} />
          <SimpleGrid columns={[1]} gap={6}>
            {presentationInfo.files.map((file) => (
              <GridItem key={file._id}>
                <VideoEmbed
                  url={file.url}
                  id={file._id}
                  removeVideo={onRemoveVideo}
                />
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
