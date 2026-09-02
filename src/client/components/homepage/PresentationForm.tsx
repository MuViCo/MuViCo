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

import type { FormEvent } from "react"
import type { CreatePresentationInput } from "../../types"

interface PresentationFormProps {
  createPresentation: (input: CreatePresentationInput) => void
  onCancel: () => void
}

const PresentationForm = ({
  createPresentation,
  onCancel,
}: PresentationFormProps) => {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  // Genuinely both: the state starts as the number 1 and the number input's
  // onChange replaces it with the raw string value.
  const [screenCount, setScreenCount] = useState<number | string>(1)
  const [startingFrameColor, setStartingFrameColor] = useState("#000000")

  const addPresentation = (event: FormEvent) => {
    event.preventDefault()
    createPresentation({
      name,
      description,
      // String() is a no-op on behaviour: parseInt already coerces its
      // argument, which is why this worked while the state held a number.
      screenCount: parseInt(String(screenCount), 10),
      startingFrameColor,
    })

    setName("")
    setDescription("")
    setScreenCount(1)
    setStartingFrameColor("#000000")
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
          <FormLabel
            htmlFor="description"
            mb={3}
            fontWeight="bold"
            style={{ marginTop: ".5em", whiteSpace: "nowrap" }}
          >
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
          <FormLabel
            htmlFor="screen-count"
            fontWeight="bold"
            style={{ marginTop: ".5em", whiteSpace: "nowrap" }}
          >
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
          <Button id="create-button" type="submit" variant="muvico-primary">
            Create
          </Button>
          <Button
            id="cancel-button"
            ml={2}
            variant="muvico-secondary"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </Flex>
      </form>
    </Box>
  )
}

export default PresentationForm
