import { useState } from "react"
import {
  FormControl,
  FormLabel,
  Input,
  Button,
  Box,
  Flex,
} from "@chakra-ui/react"

const PresentationForm = ({ createPresentation, onCancel }) => {
  const [name, setName] = useState("")
  const [screenCount, setScreenCount] = useState(1)

  const addPresentation = (event) => {
    event.preventDefault()
    createPresentation({
      name,
      screenCount
    })

    setName("")
    setScreenCount(1)
  }

  return (
    <Box>
      <form onSubmit={addPresentation}>
        <FormControl isRequired>
          <FormLabel htmlFor="name" mb={3} fontWeight="bold">
            Name
          </FormLabel>
          <Input
            data-testid="presentation-name"
            id="name"
            value={name}
            onChange={({ target }) => setName(target.value)}
          />
          
          <FormLabel htmlFor="screen-count" fontWeight="bold">
            Screen Count
          </FormLabel>
          <Input
            data-testid="presentation-screen-count"
            id="screen-count"
            type="number"
            min="1"
            value={screenCount}
            onChange={({ target }) => setScreenCount(target.value)}
          />
        </FormControl>
        <Flex align="center" mt={2} mb={4}>
          <Button id="create-button" type="submit" colorScheme="purple">
            create
          </Button>
          <Button id="cancel-button" ml={2} onClick={onCancel}>
            cancel
          </Button>
        </Flex>
      </form>
    </Box>
  )
}

export default PresentationForm
