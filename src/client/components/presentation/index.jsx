import { useEffect, useState, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  Container,
  Button,
  SimpleGrid,
  Box,
  GridItem,
  Image,
  Link,
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

export const ScreenButtons = ({ cues, openWindow }) => {
  const buttons = []
  return (
    <>
      {cues.map((cue) => {
        if (buttons.includes(cue.screen)) {
          return null
        }
        buttons.push(cue.screen)

        return (
          <Button
            key={cue.name}
            onClick={() => openWindow(cue.file.url, cue.name, cue.screen)}
          >
            Open screen {cue.screen}
          </Button>
        )
      })}
    </>
  )
}

export const ChangeCueButton = ({ cues, updateScreen }) => (
  <>
    <Button onClick={() => updateScreen(cues)}>Next cue</Button>
  </>
)

const PresentationPage = ({ userId }) => {
  const { id } = useParams()

  const [showMode, setShowMode] = useState(false)

  const [presentationInfo, setPresentationInfo] = useState(null)

  const [screensList, setScreensList] = useState([])
  const [cueIndex, setCueIndex] = useState(2)

  const navigate = useNavigate()

  const handleShowMode = () => {
    setShowMode(!showMode)
  }

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

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  )

  const openWindow = (fileUrl, name, screen) => {
    const scrn = window.open(fileUrl, name, "width=600,height=600", true)
    screensList.push(scrn)
    console.log(screensList)
  }

  const changeCueIndex = () => {
    const changedCueIndex = cueIndex + 1
    setCueIndex(changedCueIndex)
  }

  const updateScreens = (cues) => {
    changeCueIndex()
    const cuesToUpdate = []
    console.log(cues)
    cues.forEach((cue) => {
      if (cue.index === cueIndex) {
        cuesToUpdate.push(cue)
      }
    })
    screensList.forEach((screen, index) => {
      if (index + 1 === cuesToUpdate[index].screen) {
        screen.location.replace(cuesToUpdate[index].file.url)
      }
    })
  }

  if (!showMode) {
    return (
      <Container>
        {presentationInfo && (
          <>
            <Heading>{presentationInfo.name}</Heading>
            <CuesForm addCue={addCue} />
            <PresentationCues
              presentation={presentationInfo}
              removeCue={removeCue}
            />
            <Button onClick={() => handleShowMode()}>
              {showMode ? "Edit mode" : "Show mode"}
            </Button>
            <Button onClick={() => deletePresentation()}>
              Delete presentation
            </Button>
          </>
        )}
      </Container>
    )
  }
  return (
    <Container>
      {presentationInfo && (
        <>
          <Heading>{presentationInfo.name}</Heading>
          <ScreenButtons cues={presentationInfo.cues} openWindow={openWindow} />
          <PresentationCues
            presentation={presentationInfo}
            removeCue={removeCue}
          />
          <Button onClick={() => handleShowMode()}>
            {showMode ? "Edit mode" : "Show mode"}
          </Button>
          <ChangeCueButton
            cues={presentationInfo.cues}
            updateScreen={updateScreens}
          />
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
