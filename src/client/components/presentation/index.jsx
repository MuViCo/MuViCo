import { useEffect, useState, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button, Flex } from "@chakra-ui/react"
import { useNodesState, useEdgesState } from "reactflow"

import "reactflow/dist/style.css"

import presentationService from "../../services/presentation"

import ShowModeButtons from "./ShowModeButtons"
import FlowMap from "./FlowMap"
import Toolbox from "./ToolBox"

const screenCount = 4

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
            draggable: false,
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
    formData.append("image", "/blank.png")
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
      formData.append("image", "/blank.png")
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

  return (
    <>
      {presentationInfo && (
        <>
          <div style={{ display: "flex" }}>
            <div
              style={{ width: "100vw", height: "95vh", margin: 0, padding: 0 }}
            >
              <Flex flexDirection="row" flexWrap="wrap" gap={4}>
                <Button colorScheme="gray" onClick={() => handleShowMode()}>
                  {showMode ? "Edit mode" : "Show mode"}
                </Button>
                {!showMode && (
                  <>
                    <Toolbox addCue={addCue} />
                    <Button
                      colorScheme="gray"
                      onClick={() => deletePresentation()}
                    >
                      Delete presentation
                    </Button>
                  </>
                )}
                {showMode && (
                  <>
                    <ShowModeButtons
                      screensList={screensList}
                      setScreensList={setScreensList}
                      presentationInfo={presentationInfo}
                      cueIndex={cueIndex}
                      setCueIndex={setCueIndex}
                    />
                  </>
                )}
              </Flex>

              <FlowMap
                handleNodeChange={handleNodeChange}
                presentationInfo={presentationInfo}
                nodes={nodes}
                edges={edges}
                setEdges={setEdges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
              />
            </div>
          </div>
        </>
      )}
    </>
  )
}

export default PresentationPage
