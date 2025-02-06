import {
  Button,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerBody,
  Drawer,
  Input,
  FormControl,
  FormLabel,
  Divider,
  FormHelperText,
  Heading,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from "@chakra-ui/react"
import { useEffect, useState } from "react"

import {
  handleNumericInputChange,
  validateAndSetNumber,
} from "../utils/numberInputUtils"

const EditToolBox = ({ isOpen, onClose, cueData, updateCue }) => {
  const [cueName, setCueName] = useState(cueData.name)
  const [index, setIndex] = useState(cueData.index)
  const [screen, setScreen] = useState(cueData.screen)
  const [cueId, setCueId] = useState(cueData._id)
  const [file, setFile] = useState(null)
  const [fileName, setFileName] = useState(null)

  useEffect(() => {
    setCueName(cueData.name)
    setIndex(cueData.index)
    setScreen(cueData.screen)
    setCueId(cueData._id)
  }, [cueData])

  const handleSubmit = async () => {
    const updatedCue = {
      cueId,
      cueName,
      index,
      screen,
      file,
    }

    await updateCue(cueId, updatedCue)
    onClose()
  }

  const fileSelected = (event) => {
    const selected = event.target.files[0]
    if (selected) {
      setFile(selected)
      setFileName(selected.name)
    } else {
      setFile(null)
      setFileName("")
    }
  }

  return (
    <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton zIndex={1} aria-label="Close drawer" />
        <DrawerBody>
          <FormControl as="fieldset">
            <Heading size="md">Edit element</Heading>
            <FormHelperText mb={2}>Name</FormHelperText>
            <Input
              data-testid="cue-name"
              value={cueName}
              placeholder="Element name"
              mb={2}
              onChange={(e) => setCueName(e.target.value)}
            />
            <FormHelperText mb={2}>Index 1-100</FormHelperText>
            <NumberInput
              value={index}
              mb={4}
              min={1}
              max={100}
              onChange={handleNumericInputChange(setIndex)}
              onBlur={validateAndSetNumber(setIndex, 1, 100)}
              required
            >
              <NumberInputField data-testid="index-number" />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
            <FormHelperText mb={2}>Screen 1-4</FormHelperText>
            <NumberInput
              value={screen}
              mb={4}
              min={1}
              max={4}
              onChange={handleNumericInputChange(setScreen)}
              onBlur={validateAndSetNumber(setScreen, 1, 4)}
              required
            >
              <NumberInputField data-testid="screen-number" />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
            <Divider orientation="horizontal" my={4} />
            <FormLabel mt={4}>Upload media</FormLabel>
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
              accept="image/png, image/jpeg, image/jpg, image/gif, image/bmp, image/webp, image/avif, image/apng, image/ico, image/jfif, image/jpe, image/svg, video/mp4, video/3gp"
            />
            {fileName && <FormHelperText>{fileName}</FormHelperText>}
          </FormControl>
          <Button mt={4} colorScheme="purple" onClick={handleSubmit}>
            Submit
          </Button>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  )
}

export default EditToolBox
