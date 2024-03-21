import { useEffect, useState, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  Container,
  Button,
  SimpleGrid,
  Box,
  GridItem,
  Image,
  Heading,
  Flex
} from "@chakra-ui/react"
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Position,
} from "reactflow"

import "reactflow/dist/style.css"

import presentationService from "../../services/presentation"
import CuesForm from "./Cues"

const initialNodes = [
  { id: "1", position: { x: 0, y: 0 }, data: { label: "Screen 1" } },
  { id: "2", position: { x: 200, y: 0 }, data: { label: "Screen 2" } },
]

export const PresentationCues = ({ presentation, removeCue }) => (
  <>
    <Box py={4}>
      <Heading size="md">Cues:</Heading>
      <SimpleGrid columns={3} gap={6}>
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

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState()

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

  useEffect(() => {
    if (presentationInfo) {
      const newNodes = presentationInfo.cues.map((cue) => ({
        id: cue._id,
        position: { x: cue.screen * 150, y: cue.index * 25 },
        data: { label: cue.name }
      }))
      setNodes(newNodes)
    }
  }, [presentationInfo])

  const addCue = async (cueData) => {
    const { index, cueName, screen, file, fileName } = cueData
    const formData = new FormData()
    formData.append("index", index)
    formData.append("cueName", cueName)
    formData.append("screen", screen)
    formData.append("image", file)
    formData.append("fileName", fileName)
    const response = await presentationService.addCue(id, formData)
    setPresentationInfo(response)
  }

  const removeCue = async (cueId) => {
    const updatedPresentation = await presentationService.removeCue(id, cueId)
    setPresentationInfo(updatedPresentation)
  }

  const deletePresentation = async () => {
    await presentationService.remove(id)
    navigate("/home")
  }

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  )

  return (
    <Container maxW="container.xl">
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
          <div style={{ width: "50vw", height: "50vh" }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}>
              <Controls />
              <MiniMap />
              <Background gap={10} size={1} />
            </ReactFlow>
          </div>
        </>
      )}
    </Container>
  )
}

export default PresentationPage
