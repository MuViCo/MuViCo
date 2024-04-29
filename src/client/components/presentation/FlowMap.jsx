import { useCallback, useEffect } from "react"
import ReactFlow, { MiniMap, Controls, Background, addEdge } from "reactflow"

import ButtonNode from "./ButtonNode"
import ScreenNode from "./ScreenNode"

const nodeTypes = {
  buttonNode: ButtonNode,
  screenNode: ScreenNode,
}

/**
 * FlowMap component represents a flowchart visualization using the ReactFlow library.
 * The FlowMap component is used to render the control panel on the presentation page.
 *
 * @component
 * @param {Object} props - The component props.
 * @param {Function} props.handleNodeChange - The function to handle node changes.
 * @param {Object} props.presentationInfo - The presentation information.
 * @param {Array} props.nodes - The array of nodes in the flowchart.
 * @param {Array} props.edges - The array of edges in the flowchart.
 * @param {Function} props.setEdges - The function to set the edges in the flowchart.
 * @param {Function} props.onNodesChange - The function to handle node changes.
 * @param {Function} props.onEdgesChange - The function to handle edge changes.
 * @returns {JSX.Element} The rendered FlowMap component.
 */
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
