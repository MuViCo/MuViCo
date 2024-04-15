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
  Divider,
} from "@chakra-ui/react"
import { teal } from "@mui/material/colors"
import { useState } from "react"
import blankImage from "../../public/blank.png"

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
    if (selected) {
      setFile(selected)
      setFileName(selected.name)
    } else {
      setFile(blankImage)
      setFileName("blank.png")
    }
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
        <Divider orientation="horizontal" mb={4} />
        <FormHelperText>Upload media</FormHelperText>
        <label htmlFor="file-upload">
          <Button as="span" cursor="pointer">
            Upload media
          </Button>
        </label>
        <Input
          type="file"
          id="file-upload"
          style={{ display: "none" }}
          onChange={fileSelected}
        />
        <FormHelperText>or add blank cue</FormHelperText>
        <Button
          mb={4}
          onClick={() => fileSelected({ target: { files: [null] } })}
        >
          Add blank
        </Button>
        <Divider orientation="horizontal" mb={4} />
      </FormControl>
      <Button mb={4} type="submit" colorScheme="purple">
        Submit
      </Button>
    </form>
  )
}

export default CuesForm
