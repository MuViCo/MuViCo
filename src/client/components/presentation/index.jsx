import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Container, Button } from "@chakra-ui/react"

import presentationService from "../../services/presentation"
import VideoEmbed from "../videoembed/index.jsx"
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

  const onAdd = async ({ videoName, videoUrl }) => {
    const updatedPresentation = await presentationService.addVideo(
      id,
      videoName,
      videoUrl
    )
    setPresentationInfo(updatedPresentation)
  }

  console.log(presentationInfo)
  return (
    <Container>
      {presentationInfo && (
        <div>
          <p>Name: {presentationInfo.name}</p>
          <p>Cues: {presentationInfo.cues}</p>
          <Body/>
          <InputField onAdd={onAdd} />
          {presentationInfo.files.map((file) => (
            <VideoEmbed key={file._id} url={file.url} />
          ))}
        </div>
      )}
      <Button onClick={() => removePresentationOnClick(id)}>Delete</Button>
    </Container>
  )
}

export default PresentationPage
