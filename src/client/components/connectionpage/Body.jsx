import { Container, Button } from '@chakra-ui/react'
import { useState } from 'react'
import ConnectionForm from './connectionform'


const Body = () => {

  const [slaveMode, setSlaveMode] = useState(false)

  const createConnection = () => {
    console.log('Creating connection:')
  }
  const handleSlaveModeClick = () => {
    setSlaveMode(!slaveMode)
    console.log('slaveMode:', slaveMode)
  }

  return (
    <Container maxW="container.lg">
      {slaveMode ? (
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