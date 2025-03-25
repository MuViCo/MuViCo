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
  Tooltip,
  ChakraProvider,
  extendTheme,
} from "@chakra-ui/react"
import { CheckIcon, CloseIcon, InfoOutlineIcon } from "@chakra-ui/icons"
import { useState, useEffect } from "react"
import Error from "../utils/Error"
import {
  handleNumericInputChange,
  validateAndSetNumber,
  getNextAvailableIndex,
} from "../utils/numberInputUtils"

const theme = extendTheme({})

const CuesForm = ({ addCue, onClose, position, cues, cueData, updateCue }) => {
  const [file, setFile] = useState("/blank.png")
  const [fileName, setFileName] = useState("")
  const [index, setIndex] = useState(position?.index || 0)
  const [cueName, setCueName] = useState("")
  const [screen, setScreen] = useState(position?.screen || 0)
  const [cueId, setCueId] = useState("")
  const [error, setError] = useState(null)
  const allowedTypes = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/gif",
    "image/bmp",
    "image/webp",
    "image/avif",
    "image/apng",
    "image/ico",
    "image/jfif",
    "image/jpe",
    "image/svg+xml",
    "video/mp4",
    "video/3gpp",
    "audio/mpeg",
    "audio/wav",
  ]

  useEffect(() => {
    if (position) {
      setIndex(position.index)
      setScreen(position.screen)
    }
  }, [position])

  useEffect(() => {
    if (screen > 0 && !cueData) {
      setIndex((prevIndex) => {
        const newIndex = getNextAvailableIndex(screen, cues)
        return prevIndex !== newIndex ? newIndex : prevIndex // Only update if different
      })
    }
  }, [screen, cues, cueData])

  useEffect(() => {
    if (cueData) {
      setCueName(cueData.name)
      setIndex(cueData.index)
      setScreen(cueData.screen)
      setCueId(cueData._id)
      setFile(cueData.file)
      setFileName(cueData.file.name ? cueData.file.name : "")
    }
  }, [cueData, setCueName, setIndex, setScreen, setCueId, setFile])

  const checkFileType = (file) => {
    if (!allowedTypes.includes(file.type)) {
      setError("Invalid file type. Please see the info button for valid types.")
      setTimeout(() => {
        setError(null)
      }, 5000)
      return false
    }
    return true
  }

  const onAddCue = (event) => {
    event.preventDefault()

    if (file !== "/blank.png") {
      if (checkFileType(file) == false) {
        return
      }
    }

    addCue({ file, index, cueName, screen, fileName })
    setError(null)
    setFile("/blank.png")
    setFileName("")
    setCueName("")
    setIndex(0)
    setScreen(0)
    onClose()
  }

  const handleUpdateSubmit = async (event) => {
    event.preventDefault()
    const updatedCue = {
      cueId,
      cueName,
      index,
      screen,
      file,
      fileName,
    }

    if (file !== "/blank.png") {
      if (checkFileType(file) == false) {
        return
      }
    }

    await updateCue(cueId, updatedCue)

    onClose()

    setFileName("")
    setCueName("")
  }

  const fileSelected = (event) => {
    const selected = event.target.files[0]
    if (selected) {
      setFile(selected)
      setFileName(selected.name)
    } else {
      setFile("")
      setFileName("")
    }
    setError(null)
  }

  return (
    <ChakraProvider theme={theme}>
      <form onSubmit={cueData ? handleUpdateSubmit : onAddCue}>
        <FormControl as="fieldset">
          {cueData ? (
            <Heading size="md">Edit Element</Heading>
          ) : (
            <Heading size="md">Add element</Heading>
          )}
          <FormHelperText mb={2}>Screen 1-4*</FormHelperText>
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
          <FormHelperText mb={2}>Index 0-100*</FormHelperText>
          <NumberInput
            value={index}
            mb={4}
            min={0}
            max={100}
            onChange={handleNumericInputChange(setIndex)}
            onBlur={validateAndSetNumber(setIndex, 0, 100)}
            required
          >
            <NumberInputField data-testid="index-number" />
            <NumberInputStepper>
              <NumberIncrementStepper />
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
          <Divider orientation="horizontal" my={4} />
          <FormHelperText mb={2}>
            Upload media
            <Tooltip
              label={
                <>
                  <strong>Valid image types: </strong>.apng, .avif, .bmp, .cur,
                  .gif, .ico, .jfif, .jpe, .jpeg, .jpg, .png, .svg and .webp
                  <br />
                  <strong>Valid video types: </strong> .mp4 and .3gp
                  <br />
                  <strong>Valid audio types: </strong> .mp3 and .wav
                </>
              }
              placement="right-end"
              p={2}
              fontSize="sm"
            >
              <Button variant="ghost" size="xs" marginLeft={2}>
                <InfoOutlineIcon />
              </Button>
            </Tooltip>
          </FormHelperText>
          <label htmlFor="file-upload">
            <Button as="span" cursor="pointer" w={40} mr={2}>
              Upload media
            </Button>
          </label>
          <Input
            type="file"
            id="file-upload"
            data-testid="file-name"
            style={{ display: "none" }}
            onChange={fileSelected}
            accept={allowedTypes}
          />{" "}
          {fileName &&
            fileName !== "blank.png" &&
            fileName !== "undefined" &&
            (!allowedTypes.includes(file.type) ? (
              <>
                {" "}
                <CloseIcon color="#D2042D" />
                <FormHelperText>{fileName}</FormHelperText>
              </>
            ) : (
              <>
                <CheckIcon color="#03C03C" />
                <FormHelperText>{fileName}</FormHelperText>
              </>
            ))}
          {error && <Error error={error} />}
          <FormHelperText mb={2}>or add blank element</FormHelperText>
          <Button
            w={40}
            mr={2}
            onClick={() => {
              setFile("/blank.png")
              setFileName("blank.png")
            }}
          >
            Add blank
          </Button>{" "}
          {fileName === "blank.png" && (
            <>
              <CheckIcon color="#03C03C" />
              <FormHelperText>{fileName}</FormHelperText>
            </>
          )}{" "}
          <Divider orientation="horizontal" my={4} />
        </FormControl>
        <Button mb={4} type="submit" colorScheme="purple">
          Submit
        </Button>
      </form>
    </ChakraProvider>
  )
}

export default CuesForm
