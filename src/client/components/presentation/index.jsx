import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Container, Button, SimpleGrid, Box, GridItem, Image, Heading } from "@chakra-ui/react"

import presentationService from "../../services/presentation"

export const PresentationPage = () => {
  const { id } = useParams()
  const [name, setName] = useState("")
  const [file, setFile] = useState(null)
  const [presentationInfo, setPresentationInfo] = useState(null)

  const navigate = useNavigate()

  useEffect(() => {
    presentationService.get(id).then((info) => setPresentationInfo(info))
  }, [id])

  const addImage = async (event) => {
    event.preventDefault()

    const formData = new FormData()
    formData.append("image", file)
    formData.append("name", name)
    await presentationService.addFile(id, formData)

    setName("")
    setFile("")
  }

  const fileSelected = (event) => {
    const file = event.target.files[0]
    setFile(file)
  }

  const removeFile = async (fileId) => {
    const updatedPresentation = await presentationService(
      id,
      fileId
    )
    setPresentationInfo(updatedPresentation)
  }

  return (
    <Container>
      <Heading>{presentationInfo.name}</Heading>
      <form onSubmit={addImage}>
        <input onChange={fileSelected} type="file"></input>
        <input value={name} onChange={e => setName(e.target.value)} type="text" placeholder="Name"></input>
        <button type="submit">Submit</button>
      </form>
      {presentationInfo && (
        <Box>
          <p>Cues: {presentationInfo.cues}</p>
          <SimpleGrid columns={1} gap={6}>
            {presentationInfo.files.map((file) => (
              <GridItem key={file._id}>

              </GridItem>
            ))}
          </SimpleGrid>
        </Box>
      )}
    </Container>
  )
}

export default PresentationPage
