/**
 * CuesForm component for adding and editing cues in the presentation
 * 
 * This component is used in the presentation editor to allow users to add new cues or edit existing cues.
 * It supports both visual cues (images and videos) and audio cues, with validation for file types and required fields.
 * The form includes inputs for cue name, index, screen number, file upload, and color selection.
 * It also provides feedback on file selection and displays error messages for invalid inputs.
 */

import {
  FormControl,
  FormHelperText,
  Input,
  Button,
  Heading,
  Divider,
  Tooltip,
  ChakraProvider,
  extendTheme,
  Select,
  Box,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  VStack,
  Text,
  SimpleGrid,
  Image,
  IconButton,
} from "@chakra-ui/react"
import { CheckIcon, CloseIcon, InfoOutlineIcon, DeleteIcon } from "@chakra-ui/icons"
import { useState, useEffect, useRef } from "react"
import Error from "../utils/Error"
import {
  getNextAvailableIndex,
} from "../utils/numberInputUtils"
import { ColorPickerWithPresets } from "./ColorPicker"
import {
  isAudioMimeType,
  getAudioRow,
  isAudioRow,
  getAllowedMimeTypesForScreen,
} from "../utils/fileTypeUtils"

const theme = extendTheme({})


const CuesForm = ({ addCue, onClose, position, cues, cueData, updateCue, screenCount, isAudioMode = false, indexCount }) => {
  const [file, setFile] = useState(isAudioMode ? "" : "")
  const [actualFile, setActualFile] = useState(null)
  const [fileName, setFileName] = useState("")
  const [index, setIndex] = useState(position?.index || 0)
  const [cueName, setCueName] = useState(isAudioMode ? "" : "Blank")
  const [screen, setScreen] = useState(isAudioMode ? 0 : (position?.screen || 1))
  const [cueId, setCueId] = useState("")
  const [loop, setLoop] = useState(false)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)
  const [color, setColor] = useState()
  const presetColors = ["#000000", "#ffffff", "#787878", "#0000ff", "#9142ff", "#ff0000", "#ff7f00", "#ffff00", "#00ff00", "#00ffff",
    "#ff00ff", "#ff69b4", "#800000", "#808000", "#008000", "#800080", "#008080", "#000080", "#4b0082", "#ee82ee", "#a52a2a"]

  // Media pool states
  const [mediaFiles, setMediaFiles] = useState([])
  const [soundFiles, setSoundFiles] = useState([])
  const mediaInputRef = useRef(null)
  const soundInputRef = useRef(null)

  const audioRow = getAudioRow(screenCount)
  const allowedTypes = getAllowedMimeTypesForScreen(screen, screenCount)

  const isAudioFile = () => isAudioMimeType(file?.type)

  useEffect(() => {
    if (position) {
      setIndex(position.index)
      setScreen(position.screen)
    }
  }, [position])

  useEffect(() => {
    if (!cueData && !position) {
      if (isAudioMode) {
        const audioCues = cues.filter((cue) => cue.cueType === "audio")
        const newIndex = getNextAvailableIndex(0, audioCues)
        setIndex(newIndex)
      } else if (screen > 0) {
        setIndex((prevIndex) => {
          const newIndex = getNextAvailableIndex(screen, cues)
          return prevIndex !== newIndex ? newIndex : prevIndex
        })
      }
    }
  }, [screen, cues, cueData, isAudioMode, screenCount])

  useEffect(() => {
    if (cueData) {
      setCueName(cueData.name)
      setIndex(cueData.index)
      setScreen(cueData.screen)
      setCueId(cueData._id)
      setColor(cueData.color)

      if (typeof cueData.file === "string" && cueData.file.startsWith("/blank")) {
        setFile(cueData.file)
        setActualFile(null)
        setFileName("")
      } else {
        setFile("")
        setActualFile(cueData.file)
        setFileName(cueData.file && cueData.file.name ? cueData.file.name : "")
      }
      setLoop(cueData.loop)
    } else {
      if (isAudioMode) {
        setFile("")
        setCueName("")
      } else {
        setFile("")
        setCueName("Blank")
        setScreen(position?.screen || 1)
      }
    }
  }, [cueData, setCueName, setIndex, setScreen, setCueId, setFile, setColor, isAudioMode, position?.screen])

  const checkFileType = (file) => {
    if (typeof file === "string") {
      return true
    }

    if (!file || !file.type) {
      return false
    }

    const targetScreen = isAudioMimeType(file.type) ? audioRow : screen
    const allowedMimeTypes = getAllowedMimeTypesForScreen(targetScreen, screenCount)

    if (!allowedMimeTypes.includes(file.type)) {
      const errorMsg = isAudioRow(targetScreen, screenCount)
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

    const isBlankImage = file === "/blank.png" || file === "/blank-white.png" || file === "/blank-indigo.png" || file === "/blank-tropicalindigo.png"

    if (!isBlankImage && file !== "") {
      if (checkFileType(file) == false) {
        return
      }
    }


    if (isAudioMode || isAudioRow(screen, screenCount)) {
      if (isBlankImage) {
        setError("Blank elements are not allowed on the audio screen")
        setTimeout(() => setError(null), 5000)
        return
      }
      if (!isAudioFile()) {
        setError("Please select a valid audio file for the audio cue")
        setTimeout(() => setError(null), 5000)
        return
      }
    }

    addCue({ file, index, cueName, screen, fileName, color, loop })

    setError(null)
    setFile("")
    setFileName("")
    setCueName("")
    setIndex(0)
    setScreen(0)
    onClose()
  }

  const handleUpdateSubmit = async (event) => {
    event.preventDefault()

    const fileToUse = actualFile || file

    const updatedCue = {
      cueId,
      cueName,
      index,
      screen,
      color,
      file: fileToUse,
      fileName,
    }
    
    const isBlankImage = file === "/blank.png" || file === "/blank-white.png" || file === "/blank-indigo.png" || file === "/blank-tropicalindigo.png"

    if (!isBlankImage && !actualFile) {
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
      if (cueName === "" || cueName === fileName || cueName === "Blank") {
        setCueName(selected.name)
      }
      setFile(selected)
      setActualFile(null)
      setFileName(selected.name)

      if (isAudioMimeType(selected.type)) {
        if (!isAudioRow(screen, screenCount)) {
          setScreen(audioRow)
        }
      } else {
        if (isAudioRow(screen, screenCount)) {
          setScreen(1)
        }
      }
    } else {
      setFile("")
      setFileName("")
    }
    setError(null)
  }

  const blankSelected = (event) => {
    const selectedValue = event.target.value
    setFile(selectedValue)
    setActualFile(null)

    if (selectedValue.startsWith("/blank")) {
      if (cueName === "" || cueName === fileName || cueName === "Blank") {
        setCueName("Blank")
      }
      if (!cueData) {
        setFileName("")
        if (fileInputRef && fileInputRef.current) fileInputRef.current.value = ""
      }
    } else if (selectedValue === "") {
      if (cueName === "Blank" || cueName === fileName) {
        setCueName("")
      }
      if (!cueData) {
        setFileName("")
        if (fileInputRef && fileInputRef.current) fileInputRef.current.value = ""
      }
    }
  }

  const handleMediaUpload = (event) => {
    const files = Array.from(event.target.files)
    const validMediaFiles = files.filter(file => {
      const isImage = file.type.startsWith("image/")
      const isVideo = file.type.startsWith("video/")
      return isImage || isVideo
    })
    
    const newMediaFiles = validMediaFiles.map((file, idx) => ({
      id: `media-${Date.now()}-${idx}`,
      file,
      name: file.name,
      type: file.type,
      preview: URL.createObjectURL(file)
    }))
    
    setMediaFiles(prev => [...prev, ...newMediaFiles])
  }

  const handleSoundUpload = (event) => {
    const files = Array.from(event.target.files)
    const validAudioFiles = files.filter(file => isAudioMimeType(file.type))
    
    const newSoundFiles = validAudioFiles.map((file, idx) => ({
      id: `sound-${Date.now()}-${idx}`,
      file,
      name: file.name,
      type: file.type
    }))
    
    setSoundFiles(prev => [...prev, ...newSoundFiles])
  }

  const removeMediaFile = (id) => {
    setMediaFiles(prev => {
      const file = prev.find(f => f.id === id)
      if (file?.preview) {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter(f => f.id !== id)
    })
  }

  const removeSoundFile = (id) => {
    setSoundFiles(prev => prev.filter(f => f.id !== id))
  }
  // form with inputs for cue name, index, screen number, file upload, and color selection. 
  // It also includes front end validation for file types and displays error messages when necessary. 
  // The form supports both adding new cues and editing existing cues, with appropriate handling for each case.
  return (
    <ChakraProvider theme={theme}>

      <form onSubmit={cueData ? handleUpdateSubmit : onAddCue}>
        <FormControl as="fieldset">
          {cueData ? (
            <Heading size="md" mb={4}>Edit Element</Heading>
          ) : (
            <Heading size="md" mb={4}>Add element</Heading>
          )}

          <Tabs variant="enclosed" colorScheme="purple">
            <TabList>
              <Tab>Colors</Tab>
              <Tab>Media</Tab>
              <Tab>Sounds</Tab>
            </TabList>

            <TabPanels>
              {/* COLORS TAB */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  <FormHelperText>
                    Select a color and drag it to the timeline
                  </FormHelperText>
                  
                  <ColorPickerWithPresets
                    color={color}
                    onChange={setColor}
                    presetColors={presetColors}
                  />

                  <Box
                    className="droppable-color-element"
                    draggable={true}
                    unselectable="on"
                    onDragStart={(e) => {
                      e.dataTransfer.setData("application/json", JSON.stringify({ 
                        type: "newCueFromForm",
                        cueName: cueName || "Color Element", 
                        color: color || "#e014ee",
                        elementType: "color"
                      }))
                    }}
                    p={6}
                    bg={color || "purple.100"}
                    border="2px dashed"
                    borderColor="purple.400"
                    borderRadius="md"
                    textAlign="center"
                    cursor="grab"
                    _active={{ cursor: "grabbing" }}
                    _hover={{ opacity: 0.8 }}
                  >
                    <Text fontWeight="bold">Drag color to timeline</Text>
                  </Box>
                </VStack>
              </TabPanel>

              {/* MEDIA TAB */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  <FormHelperText>
                    Upload images or videos and drag them to the timeline
                    <Tooltip
                      label={
                        <>
                          <strong>Valid image types: </strong>.apng, .avif, .bmp, .cur,
                          .gif, .ico, .jfif, .jpe, .jpeg, .jpg, .png, .svg and .webp
                          <br />
                          <strong>Valid video types: </strong> .mp4 and .3gp
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

                  <Input
                    type="file"
                    id="media-upload"
                    ref={mediaInputRef}
                    style={{ display: "none" }}
                    onChange={handleMediaUpload}
                    accept="image/*,video/mp4,video/3gpp"
                    multiple
                  />
                  
                  <Button 
                    onClick={() => mediaInputRef.current?.click()}
                    colorScheme="purple"
                    variant="outline"
                  >
                    Upload Images/Videos
                  </Button>

                  {mediaFiles.length > 0 && (
                    <>
                      <Divider />
                      <Text fontWeight="bold">Media Pool ({mediaFiles.length})</Text>
                      <SimpleGrid columns={2} spacing={3}>
                        {mediaFiles.map((media) => (
                          <Box
                            key={media.id}
                            draggable={true}
                            onDragStart={(e) => {
                              e.dataTransfer.setData("application/json", JSON.stringify({ 
                                type: "newCueFromForm",
                                cueName: media.name,
                                elementType: "media",
                                mediaId: media.id,
                                file: media.file
                              }))
                            }}
                            position="relative"
                            border="2px solid"
                            borderColor="purple.300"
                            borderRadius="md"
                            p={2}
                            cursor="grab"
                            _active={{ cursor: "grabbing" }}
                            _hover={{ borderColor: "purple.500", bg: "purple.50" }}
                          >
                            <IconButton
                              icon={<DeleteIcon />}
                              size="xs"
                              colorScheme="red"
                              position="absolute"
                              top={1}
                              right={1}
                              onClick={() => removeMediaFile(media.id)}
                              zIndex={1}
                            />
                            {media.type.startsWith("image/") && (
                              <Image 
                                src={media.preview} 
                                alt={media.name}
                                maxH="100px"
                                objectFit="contain"
                                w="100%"
                              />
                            )}
                            {media.type.startsWith("video/") && (
                              <Box bg="gray.200" p={4} textAlign="center">
                                <Text fontSize="2xl">🎥</Text>
                              </Box>
                            )}
                            <Text fontSize="xs" mt={1} noOfLines={1}>
                              {media.name}
                            </Text>
                          </Box>
                        ))}
                      </SimpleGrid>
                    </>
                  )}
                </VStack>
              </TabPanel>

              {/* SOUNDS TAB */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  <FormHelperText>
                    Upload audio files and drag them to the timeline
                    <Tooltip
                      label={
                        <><strong>Valid audio types: </strong> .mp3 and .wav</>
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

                  <Input
                    type="file"
                    id="sound-upload"
                    ref={soundInputRef}
                    style={{ display: "none" }}
                    onChange={handleSoundUpload}
                    accept="audio/mpeg,audio/wav,audio/vnd.wave"
                    multiple
                  />
                  
                  <Button 
                    onClick={() => soundInputRef.current?.click()}
                    colorScheme="purple"
                    variant="outline"
                  >
                    Upload Audio Files
                  </Button>

                  {soundFiles.length > 0 && (
                    <>
                      <Divider />
                      <Text fontWeight="bold">Sound Pool ({soundFiles.length})</Text>
                      <VStack spacing={2} align="stretch">
                        {soundFiles.map((sound) => (
                          <Box
                            key={sound.id}
                            draggable={true}
                            onDragStart={(e) => {
                              e.dataTransfer.setData("application/json", JSON.stringify({ 
                                type: "newCueFromForm",
                                cueName: sound.name,
                                elementType: "sound",
                                soundId: sound.id,
                                file: sound.file
                              }))
                            }}
                            display="flex"
                            alignItems="center"
                            justifyContent="space-between"
                            border="2px solid"
                            borderColor="purple.300"
                            borderRadius="md"
                            p={3}
                            cursor="grab"
                            _active={{ cursor: "grabbing" }}
                            _hover={{ borderColor: "purple.500", bg: "purple.50" }}
                          >
                            <Box display="flex" alignItems="center" flex={1}>
                              <Text fontSize="2xl" mr={2}>🔊</Text>
                              <Text fontSize="sm" noOfLines={1}>
                                {sound.name}
                              </Text>
                            </Box>
                            <IconButton
                              icon={<DeleteIcon />}
                              size="sm"
                              colorScheme="red"
                              onClick={() => removeSoundFile(sound.id)}
                            />
                          </Box>
                        ))}
                      </VStack>
                    </>
                  )}
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>


          {error && <Error error={error} />}
        </FormControl>
      </form>
    </ChakraProvider>
  )
}

export default CuesForm
