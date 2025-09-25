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

const CuesForm = ({ addCue, addAudioCue, onClose, position, cues, audioCues = [], cueData, updateCue, screenCount, isAudioMode = false, indexCount }) => {
  const [file, setFile] = useState("/blank.png")
  const [fileName, setFileName] = useState("")
  const [index, setIndex] = useState(position?.index || 0)
  const [cueName, setCueName] = useState("")
  const [screen, setScreen] = useState(isAudioMode ? 0 : (position?.screen || 0))
  const [cueId, setCueId] = useState("")
  const [loop, setLoop] = useState(false)
  const [error, setError] = useState(null)
  const visualTypes = [
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
  ]

  const audioTypes = [
    "audio/mpeg",
    "audio/wav",
  ]

  const allowedTypes = screen === screenCount + 1 ? audioTypes : visualTypes

  const isAudioFile = () => file?.type?.includes("audio/")

  useEffect(() => {
    if (position) {
      setIndex(position.index)
      setScreen(position.screen)
    }
  }, [position])

  useEffect(() => {
    if (!cueData) {
      if (isAudioMode) {
        const newIndex = getNextAvailableIndex(0, audioCues)
        setIndex(newIndex)
      } else if (screen > 0) {
        setIndex((prevIndex) => {
          const newIndex = getNextAvailableIndex(screen, cues)
          return prevIndex !== newIndex ? newIndex : prevIndex // Only update if different
        })
      }
    }
  }, [screen, cues, audioCues, cueData, isAudioMode])

  useEffect(() => {
    if (cueData) {
      setCueName(cueData.name)
      setIndex(cueData.index)
      setScreen(cueData.screen)
      setCueId(cueData._id)
      setFile(cueData.file)
      setFileName(cueData.file.name ? cueData.file.name : "")
      setLoop(cueData.loop)
    }
  }, [cueData, setCueName, setIndex, setScreen, setCueId, setFile])

  const checkFileType = (file) => {
    const isAudio = file.type.includes("audio/")
    const currentScreen = screen
    
    // For audio files, check if they'll be placed correctly (auto-assigned to audio screen)
    const effectiveScreen = isAudio ? screenCount + 1 : currentScreen
    
    // Check if the file type is allowed for the effective screen
    const effectiveAllowedTypes = effectiveScreen === screenCount + 1 ? audioTypes : visualTypes
    
    if (!effectiveAllowedTypes.includes(file.type)) {
      const errorMsg = effectiveScreen === screenCount + 1
        ? "Invalid file type. Only audio files (.mp3, .wav) are allowed on the audio screen."
        : "Invalid file type. Please see the info button for valid visual file types."
      setError(errorMsg)
      setTimeout(() => setError(null), 5000)
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

    if (isAudioMode && addAudioCue) {
      addAudioCue({ file, index, cueName, fileName, loop })
    } else {
      addCue({ file, index, cueName, screen, fileName, loop })
    }
    
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

      if (selected.type && selected.type.includes("audio")) {
        if (screen !== screenCount + 1) {
          setScreen(screenCount + 1)
        }
      } else {
        if (screen === screenCount + 1) {
          setScreen(1)
        }
      }
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
          {!isAudioMode && (
            <>
              <FormHelperText mb={2}>
                Screen 1-4 for images and videos and screen 5 for audio only*
              </FormHelperText>
              <NumberInput
                id="screen-number"
                value={screen}
                mb={4}
                min={1}
                max={screenCount + 1}
                onChange={handleNumericInputChange(setScreen)}
                onBlur={validateAndSetNumber(setScreen, 1, screenCount + 1)}
                required
              >
                <NumberInputField data-testid="screen-number" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </>
          )}
          
          {isAudioMode && (
            <FormHelperText mb={4} color="purple.600">
              Adding audio cue (screen not applicable)
            </FormHelperText>
          )}
          <FormHelperText mb={2}>Frame 0-{indexCount-1}*</FormHelperText>
          <NumberInput
            id="index-number"
            value={index}
            mb={4}
            min={0}
            max={indexCount}
            onChange={handleNumericInputChange(setIndex)}
            onBlur={validateAndSetNumber(setIndex, 0, indexCount)}
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
            id="cue-name"
            value={cueName}
            placeholder="Element name"
            mb={2}
            onChange={(e) => setCueName(e.target.value)}
            required
          />
          <Divider orientation="horizontal" my={4} />
          <FormHelperText mb={2}>
            {isAudioMode ? "Upload audio file" : "Upload media"}
            <Tooltip
              label={
                isAudioMode || screen === screenCount + 1 ? (
                  <><strong>Valid audio types: </strong> .mp3 and .wav</>
                ) : (
                  <>
                    <strong>Valid image types: </strong>.apng, .avif, .bmp, .cur,
                    .gif, .ico, .jfif, .jpe, .jpeg, .jpg, .png, .svg and .webp
                    <br />
                    <strong>Valid video types: </strong> .mp4 and .3gp
                  </>
                )
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
            accept={allowedTypes.join(",")}
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
