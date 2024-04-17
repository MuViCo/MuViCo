import { useEffect, useState, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  Button,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerBody,
  Drawer,
  Box,
  Flex,
  Heading,
} from "@chakra-ui/react"
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from "reactflow"

import "reactflow/dist/style.css"

import presentationService from "../../services/presentation"
import CuesForm from "./Cues"
import ButtonNode from "./ButtonNode"
import ScreenNode from "./ScreenNode"

const screenCount = 4
const nodeTypes = {
  buttonNode: ButtonNode,
  screenNode: ScreenNode,
}

export const ScreenButtons = ({ openWindow, closeWindow, screens }) => (
  <>
    {[...Array(screenCount)].map((_, index) => {
      if (screens[index]) {
        return (
          <Button
            bg="purple.500"
            key={index + 1}
            onClick={() => closeWindow(index + 1)}
          >
            Close screen: {index + 1}
          </Button>
        )
      }
      return (
        <Button
          bg="purple"
          key={index + 1}
          onClick={() => openWindow(index + 1)}
        >
          Open screen: {index + 1}
        </Button>
      )
    })}
  </>
)

export const ChangeCueButton = ({ cues, updateScreen, direction }) => (
  <>
    <Button
      width={40}
      bg="purple"
      onClick={() => updateScreen(cues, direction)}
    >
      {direction} cue
    </Button>
  </>
)

const Toolbox = ({ addCue }) => {
  const [isOpen, setIsOpen] = useState(false)

  const onClose = () => setIsOpen(false)
  const onOpen = () => setIsOpen(true)

  return (
    <>
      <Button onClick={onOpen}>Add Cue</Button>
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerBody>
            <CuesForm addCue={addCue} onClose={onClose} />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  )
}

const PresentationPage = ({ userId }) => {
  const { id } = useParams()

  const [showMode, setShowMode] = useState(false)

  const [presentationInfo, setPresentationInfo] = useState(null)

  const [screensList, setScreensList] = useState([null, null, null, null])
  const [cueIndex, setCueIndex] = useState(0)

  const navigate = useNavigate()

  const handleShowMode = () => {
    setShowMode(!showMode)
  }

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  useEffect(() => {
    presentationService
      .get(id)
      .then((presentation) => {
        setPresentationInfo(presentation)
      })
      .catch((error) => {
        console.log(error)
        navigate("/home")
      })
  }, [id, userId, navigate])

  const handleNodeChange = useCallback(
    (presentation) => {
      // Sort the nodes based on screen and index
      const sortedNodes = presentation.cues.sort((a, b) => {
        // Compare by screen value first
        if (a.screen !== b.screen) {
          return a.screen - b.screen
        }
        // If screen values are equal, compare by index
        return a.index - b.index
      })

      const newNodes = []
      for (let i = 0; i < screenCount; i += 1) {
        newNodes.push({
          id: `${i}`,
          type: "screenNode",
          position: { x: i * 210, y: 10 },
          data: { label: `screen ${i}` },
        })
      }
      sortedNodes.forEach((node) => {
        if (node.index !== 0) {
          newNodes.push({
            id: node._id,
            type: "buttonNode",
            position: { x: node.index * 210, y: 200 + node.screen * 125 },
            data: {
              cue: node,
            },
          })
        }
      })
      setNodes(newNodes)

      const newEdges = []
      for (let i = 0; i < presentation.cues.length - 1; i += 1) {
        const currentNode = presentation.cues[i]
        const nextNode = presentation.cues[i + 1]
        if (currentNode.screen === nextNode.screen) {
          // If consecutive nodes belong to the same screen, create an edge
          newEdges.push({
            source: currentNode._id,
            target: nextNode._id,
          })
        }
      }
      setEdges(newEdges)
    },
    [setNodes, setEdges]
  )
  const addBlankCue = async (screen) => {
    const formData = new FormData()
    formData.append("index", 0)
    formData.append("cueName", `intial cue for screen ${screen}`)
    formData.append("screen", screen)
    formData.append("image", "/src/client/public/blank.png")
    await presentationService.addCue(id, formData)
  }

  const addCue = async (cueData) => {
    const { index, cueName, screen, file, fileName } = cueData
    const formData = new FormData()

    // Check if cue is the first cue to be added to the screen
    const screenCues = presentationInfo.cues.filter(
      (cue) => cue.screen === Number(screen)
    )
    if (screenCues.length === 0) {
      await addBlankCue(screen)
    }

    // Check if cue with same index and screen already exists
    const cueExists = presentationInfo.cues.some(
      (cue) => cue.index === Number(index) && cue.screen === Number(screen)
    )
    if (cueExists) {
      alert("Cue with same index and screen already exists") // eslint-disable-line no-alert
      return
    }

    formData.append("index", index)
    formData.append("cueName", cueName)
    formData.append("screen", screen)
    // Add blank image if no file is selected
    if (!file) {
      formData.append("image", "/src/client/public/blank.png")
    } else {
      formData.append("image", file)
    }
    await presentationService.addCue(id, formData)
    const updatedPresentation = await presentationService.get(id)
    setPresentationInfo(updatedPresentation)
    handleNodeChange(updatedPresentation)
  }

  const deletePresentation = async () => {
    await presentationService.remove(id)
    navigate("/home")
  }

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  useEffect(() => {
    if (presentationInfo) {
      handleNodeChange(presentationInfo)
    }
  }, [presentationInfo, handleNodeChange])

  const openWindow = (screen) => {
    const cueToOpen = presentationInfo.cues.find(
      (cue) => cue.screen === screen && cue.index === cueIndex
    )
    if (!cueToOpen) {
      alert("No cues found for this screen") // eslint-disable-line no-alert
      return
    }
    const scrn = window.open(
      cueToOpen.file.url,
      cueToOpen.name,
      "width=600,height=600",
      true
    )
    const newScreens = [...screensList]
    newScreens[screen - 1] = scrn
    setScreensList(newScreens)
  }

  const closeWindow = (screen) => {
    const newScreens = [...screensList]
    newScreens[screen - 1].close()
    newScreens[screen - 1] = null
    setScreensList(newScreens)
  }

  const changeCueIndex = (direction) => {
    if (direction === "Next") {
      const newIndex = cueIndex + 1
      setCueIndex(newIndex)
      return newIndex
    }
    const newIndex = cueIndex === 0 ? 0 : cueIndex - 1
    setCueIndex(newIndex)
    return newIndex
  }

  const updateScreens = (cues, direction) => {
    const newIndex = changeCueIndex(direction)
    cues.forEach((cue) => {
      if (cue.index === newIndex) {
        const screen = screensList[cue.screen - 1]
        if (screen) {
          screen.location.replace(cue.file.url)
        }
      }
    })
  }
  useEffect(() => {
    const handleKeyUp = (e) => {
      if (e.key === "ArrowRight") {
        updateScreens(presentationInfo.cues)
      }
    }

    document.addEventListener("keyup", handleKeyUp)

    return () => {
      document.removeEventListener("keyup", handleKeyUp)
    }
  })

  // toi ylempi ilan useEffectiä. toimii kaikilla sivuilla
  // document.onkeyup = function handleKeyUp(e) {
  //   if (e.key === "ArrowRight") {
  //     updateScreens(presentationInfo.cues)
  //   }
  // }

  return (
    <>
      {presentationInfo && (
        <>
          <div style={{ display: "flex" }}>
            <div
              style={{ width: "100vw", height: "95vh", margin: 0, padding: 0 }}
            >
              <Flex flexDirection="row" flexWrap="wrap" gap={4}>
                <Button bg="gray" onClick={() => handleShowMode()}>
                  {showMode ? "Edit mode" : "Show mode"}
                </Button>
                {!showMode && (
                  <>
                    <Toolbox addCue={addCue} />
                    <Button onClick={() => deletePresentation()}>
                      Delete presentation
                    </Button>
                  </>
                )}
                {showMode && (
                  <>
                    <ScreenButtons
                      openWindow={openWindow}
                      closeWindow={closeWindow}
                      screens={screensList}
                    />
                    <Box
                      display="flex"
                      justifyContent="flex-end"
                      alignItems="center"
                      flex="1"
                      gap={4}
                    >
                      <ChangeCueButton
                        cues={presentationInfo.cues}
                        updateScreen={updateScreens}
                        direction="Previous"
                      />
                      <Heading size="md">Cue {cueIndex}</Heading>
                      <ChangeCueButton
                        cues={presentationInfo.cues}
                        updateScreen={updateScreens}
                        direction="Next"
                      />
                    </Box>
                  </>
                )}
              </Flex>

              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
              >
                <Controls />
                <MiniMap />
                <Background gap={20} size={1} />
              </ReactFlow>
            </div>
          </div>
        </>
      )}
    </>
  )
}

export default PresentationPage
