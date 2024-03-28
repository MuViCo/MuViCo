import { Container, Button } from "@chakra-ui/react"
import { useState } from "react"
import ConnectionForm from "./connectionform"
import connectService from "../../services/connection"

const ConnectionPage = () => {
  const [masterMode, setMasterMode] = useState(true)
  console.log("Master mode:", masterMode)

  const createConnection = () => {
    console.log("Creating connection:")
  }
  const handleSlaveModeClick = () => {
    setMasterMode(!masterMode)
  }

  const handleServerConnectionClick = () => {
    console.log("Starting server connection:")
    connectService.create()
  }

  return (
    <Container maxW="container.lg">
      {masterMode ? (
        <div>
          <Button onClick={() => handleSlaveModeClick()} mr={2}>
            Switch to slave mode
          </Button>
          <Button onClick={() => handleServerConnectionClick()}>
            Start a server connection
          </Button>
        </div>
      ) : (
        <div>
          <Button onClick={() => handleSlaveModeClick()}>
            Switch to master mode
          </Button>
          <ConnectionForm createConnection={createConnection} />
        </div>
      )}
    </Container>
  )
}

export default ConnectionPage
