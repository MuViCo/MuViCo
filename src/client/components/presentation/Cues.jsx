import {
  FormControl,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  FormHelperText,
  NumberDecrementStepper,
  Input,
  Button,
  Heading,
} from "@chakra-ui/react"
import { useState } from "react"

const CuesForm = ({ addCue }) => {
  const [file, setFile] = useState(null)
  const [fileName, setFileName] = useState("")
  const [index, setIndex] = useState(0)
  const [cueName, setCueName] = useState("")
  const [screen, setScreen] = useState(0)

  const onAddCue = (event) => {
    event.preventDefault()
    addCue({ file, index, cueName, screen, fileName })
    setFile(null)
    setFileName("")
    setCueName("")
    setIndex(0)
    setScreen(0)
  }

  const fileSelected = (event) => {
    const selected = event.target.files[0]
    setFile(selected)
    setFileName(selected.name)
  }

  return (
    <form onSubmit={onAddCue}>
      <FormControl as="fieldset">
        <Heading size="md">Add cue</Heading>
        <FormHelperText>Index 1-350</FormHelperText>
        <NumberInput value={index} mb={4} min={1} max={350} onChange={setIndex}>
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
        <FormHelperText>Name*</FormHelperText>
        <Input
          value={cueName}
          placeholder="Cue name"
          mb={4}
          onChange={(e) => setCueName(e.target.value)}
          required
        />
        <FormHelperText>Screen 1-4*</FormHelperText>
        <NumberInput
          value={screen}
          mb={4}
          min={1}
          max={4}
          onChange={setScreen}
          required
        >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
        <Input type="file" mb={4} onChange={fileSelected} />
      </FormControl>
      <Button mb={4} type="submit">
        Submit
      </Button>
    </form>
  )
}

export default CuesForm
