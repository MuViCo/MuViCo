/*
* presentation form component for creating a new presentation, includes fields for name, description and  screen count.
* The form is used in the homepage component when the user clicks on the "New Presentation" button.
* The form also includes a cancel button that closes the form without creating a new presentation.
 */
import { useState } from "react"
import {
  FormControl,
  FormLabel,
  Input,
  Button,
  Box,
  Flex,
  Select,
} from "@chakra-ui/react"

const PresentationForm = ({ createPresentation, onCancel }) => {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [screenCount, setScreenCount] = useState(1)
  const [startingFrameColor, setStartingFrameColor] = useState("#000000")

  const addPresentation = (event) => {
    event.preventDefault()
    createPresentation({
      name,
      description,
      screenCount: parseInt(screenCount, 10),
      startingFrameColor 
    })

    setName("")
    setDescription("")
    setScreenCount(1)
    setStartingFrameColor("#FF0000") // this is a debugging color, it should be set to black by default, but it is set to red for testing purposes
    onCancel()
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
        </FormControl>

        <FormControl>
          <FormLabel htmlFor="description" mb={3} fontWeight="bold" style={{ marginTop: ".5em", whiteSpace: "nowrap" }}>
            Description
          </FormLabel>
          <Input
            data-testid="presentation-description"
            id="description"
            value={description}
            onChange={({ target }) => setDescription(target.value)}
          />
        </FormControl>
        
        <FormControl isRequired>
          <FormLabel htmlFor="screen-count" fontWeight="bold" style={{ marginTop: ".5em", whiteSpace: "nowrap" }}>
            Screen Count (max 8)
          </FormLabel>
          <Input
            data-testid="presentation-screen-count"
            id="screen-count"
            type="number"
            min="1"
            max="8"
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
