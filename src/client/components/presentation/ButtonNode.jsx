import { Handle, Position } from "reactflow"
import { Box } from "@chakra-ui/react"
import { useNavigate, useParams } from "react-router-dom"
import presentationService from "../../services/presentation"

const ButtonNode = ({ data }) => {
  const { id } = useParams()
  const { cue } = data
  const navigate = useNavigate()

  const handleRemove = async (cueId) => {
    await presentationService.removeCue(id, cueId)
    navigate(`/presentation/${id}`)
  }

  return (
    <Box
      w="100px" // Adjust width and height according to your design
      h="50px"
      bg="blue.500" // Example background color
      borderRadius="md" // Example border radius
      boxShadow="md" // Example box shadow
      p="3" // Example padding
    >
      <Handle type="target" position={Position.Top} isConnectable={true} />
      <div>{cue.name}</div>
      <div>{cue.file.name}</div>
      <div>
        <button onClick={() => handleRemove(cue._id)} >Remove cue</button>
      </div>
      <Handle type="source" position={Position.Bottom} isConnectable={true} />
    </ Box>
  )
}

export default ButtonNode
