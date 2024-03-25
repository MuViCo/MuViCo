import { Handle, Position } from "reactflow"
import { Box } from "@chakra-ui/react"

const ScreenNode = (data) => {
  const { label } = data
  return (
    <div>
      <Handle type="source" position={Position.Top} isConnectable={true} />
      <div>{label}</div>
      <Handle type="source" position={Position.Bottom} isConnectable={true} />
    </div>
  )
}

export default ScreenNode
