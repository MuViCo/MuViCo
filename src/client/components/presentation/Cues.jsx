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
  Flex,
  Box,
} from "@chakra-ui/react"
import { CheckIcon } from "@chakra-ui/icons"

import { useState, useEffect } from "react"

/**
 * Renders a form for adding cues.
 *
 * @component
 * @param {Object} props - The component props.
 * @param {Function} props.addCue - The function to add a cue.
 * @returns {JSX.Element} The CuesForm component.
 */
const CuesForm = ({ addCue, onClose, position }) => {
  const [file, setFile] = useState("/blank.png")
  const [fileName, setFileName] = useState("blank.png")
  const [index, setIndex] = useState(position?.index || 0)
  const [cueName, setCueName] = useState("")
  const [screen, setScreen] = useState(position?.screen || 0)
  
  useEffect(() => {
    if (position) {
      setIndex(position.index)
      setScreen(position.screen)
    }
  }, [position])

  const onAddCue = (event) => {
    event.preventDefault()
    addCue({ file, index, cueName, screen, fileName })
    setFile("/blank.png")
    setFileName("")
    setCueName("")
    setIndex(0)
    setScreen(0)
    onClose()
  }

  const fileSelected = (event) => {
    const selected = event.target.files[0]
    if (selected) {
      setFile(selected)
      setFileName(selected.name)
    } else {
      setFile("/blank.png")
      setFileName("blank.png")
    }
  }

  return (
    <form onSubmit={onAddCue}>
      <FormControl as="fieldset">
        <Heading size="md">Add element</Heading>
        <FormHelperText mb={2}>Index 1-350</FormHelperText>
        <NumberInput value={index} mb={4} min={1} max={350} onChange={setIndex}>
          <NumberInputField data-testid="index-number"/>
          <NumberInputStepper>
            <NumberIncrementStepper/>
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
        <FormHelperText mb={2}>Name*</FormHelperText>
        <Input
          data-testid="cue-name"
          value={cueName}
          placeholder="Element name"
          mb={2}
          onChange={(e) => setCueName(e.target.value)}
          required
        />
        <FormHelperText mb={2}>Screen 1-4*</FormHelperText>
        <NumberInput
          value={screen}
          mb={4}
          min={1}
          max={4}
          onChange={setScreen}
          required
        >
          <NumberInputField  data-testid="screen-number"/>
          <NumberInputStepper>
            <NumberIncrementStepper/>
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
        <Divider orientation="horizontal" my={4} />
        <FormHelperText mb={2}>Upload media</FormHelperText>
        <label htmlFor="file-upload">
          <Button as="span" cursor="pointer" w={40} mr={2}>
            Upload media
          </Button>
        </label>
        <Input
          type="file"
          id="file-upload"
          style={{ display: "none" }}
          onChange={fileSelected}
        />{" "}
        {file !== "/blank.png" && <CheckIcon color="green.500" />}
        <FormHelperText mb={2}>or add blank element</FormHelperText>
        <Button
          w={40}
          mr={2}
          onClick={() => {
            setFile("/blank.png")
            setFileName("")
          }}
        >
          Add blank
        </Button>{" "}
        {file === "/blank.png" && <CheckIcon color="green.500" />}
        <Divider orientation="horizontal" my={4} />
      </FormControl>
      <Button mb={4} type="submit" colorScheme="purple">
        Submit
      </Button>
    </form>
  )
}

export default CuesForm
