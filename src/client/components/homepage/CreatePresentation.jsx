import { useState } from "react"
import {
  FormControl,
  FormLabel,
  Input,
  Button,
  Box,
  Flex,
} from "@chakra-ui/react"

const CreatePresentation = ({ createPresentation, onCancel }) => {
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
      <form onSubmit={addPresentation}>
        <FormControl>
          <FormLabel htmlFor="name" mb={3} fontWeight="bold">
            Name
          </FormLabel>
          <Input
            data-testid="presentation-name"
            id="name"
            value={name}
            onChange={({ target }) => setName(target.value)}
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

export default CreatePresentation
