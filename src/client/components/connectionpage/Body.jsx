import { Container, Button } from '@chakra-ui/react'
import { useState } from 'react'
import ConnectionForm from './connectionform'


const Body = () => {

  const [masterMode, setMasterMode] = useState(true)
  console.log('Master mode:', masterMode)

  const createConnection = () => {
    console.log('Creating connection:')
  }
  const handleSlaveModeClick = () => {
    setMasterMode(!masterMode)
  }

  return (
    <Container maxW="container.lg">
      {masterMode ? (
        <div>
          <Button onClick={() => handleSlaveModeClick()}>Switch to slave mode</Button><ConnectionForm createConnection={createConnection} />
        </div>
      ) : (
        <Button onClick={() => handleSlaveModeClick()}>Switch to master mode</Button>
      )}
    </Container>
  )
}

export default Body