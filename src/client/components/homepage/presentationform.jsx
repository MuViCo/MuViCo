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

  const addPresentation = (event) => {
    event.preventDefault()
    createPresentation({
      name,
    })

    setName("")
  }

  return (
    <Box>
      <h2>Create new</h2>
      <form onSubmit={addPresentation}>
        <FormControl>
          <FormLabel htmlFor="name" mb={0} fontWeight="bold">
            Name
          </FormLabel>
          <Input
            id="name"
            value={name}
            onChange={({ target }) => setName(target.value)}
          />
        </FormControl>
        <Flex align="center" mt={2}>
          <Button id="create-button" type="submit" colorScheme="teal">
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
