import { Handle, Position } from "reactflow"
import { Box, Button, Icon, Image, Text } from "@chakra-ui/react"
import { DeleteIcon, ExternalLinkIcon } from "@chakra-ui/icons"
import { useState } from "react"
import { useNavigate, useParams, Link } from "react-router-dom"
import presentationService from "../../services/presentation"

const ButtonNode = ({ data }) => {
  const { id } = useParams()
  const { cue } = data
  const [isHovered, setIsHovered] = useState(false)

  const handleRemove = async (cueId) => {
    await presentationService.removeCue(id, cueId)
    window.location.reload(false)
  }

  return (
    <Box
      w="200px"
      bg="gray.400"
      borderRadius="md"
      boxShadow="md"
      textAlign="center"
      position="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      key={cue._id}
    >
      <Handle type="target" position={Position.Top} isConnectable={true} />
      <Box
        h="80px"
        position="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Image
          src={cue.file.url}
          alt=""
          objectFit="cover"
          w="100%"
          h="100%"
          borderRadius="md"
        />
        <Text
          position="absolute"
          bottom="3"
          left="0"
          w="100%"
          color="white"
          fontWeight="bold"
          style={{ textShadow: "2px 2px 4px rgba(0,0,0,1)" }}
        >
          {cue.name}
        </Text>
        {isHovered && ( // Show remove button only when hovered
          <Button
            onClick={() => handleRemove(cue._id)}
            size="sm"
            mt="2"
            position="absolute"
            top="15%"
            left="88%"
            transform="translate(-50%, -50%)"
            zIndex="1"
          >
            <Icon as={DeleteIcon} />
          </Button>
        )}
      </Box>
      <Handle type="source" position={Position.Bottom} isConnectable={true} />
    </Box >
  )
}

export default ButtonNode
