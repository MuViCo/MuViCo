import { useCallback, useEffect } from "react"
import ReactFlow, { MiniMap, Controls, Background, addEdge } from "reactflow"

import ButtonNode from "./ButtonNode"
import ScreenNode from "./ScreenNode"

const nodeTypes = {
  buttonNode: ButtonNode,
  screenNode: ScreenNode,
}

const FlowMap = ({
  handleNodeChange,
  presentationInfo,
  nodes,
  edges,
  setEdges,
  onNodesChange,
  onEdgesChange,
}) => {
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  useEffect(() => {
    if (presentationInfo) {
      handleNodeChange(presentationInfo)
    }
  }, [presentationInfo, handleNodeChange])

  return (
    <>
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
    </>
  )
}

export default FlowMap
