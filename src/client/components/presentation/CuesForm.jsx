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
  Box,
  VStack,
  HStack,
  Text,
  SimpleGrid,
  Image,
  IconButton,
} from "@chakra-ui/react"
import { InfoOutlineIcon, DeleteIcon } from "@chakra-ui/icons"
import { SpeakerIcon } from "../../lib/icons"
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
import mediaStore from "./mediaFileStore"

const theme = extendTheme({})

const transparentDragImage = (() => {
  if (typeof document === "undefined") {
    return null
  }

  const canvas = document.createElement("canvas")
  canvas.width = 1
  canvas.height = 1
  return canvas
})()

const suppressNativeDragGhost = (dataTransfer) => {
  if (!dataTransfer?.setDragImage || !transparentDragImage) {
    return
  }

  dataTransfer.setDragImage(transparentDragImage, 0, 0)
}


const CuesForm = ({ addCue, onClose, position, cues, cueData, updateCue, screenCount, isAudioMode = false, indexCount }) => {
  const [file, setFile] = useState("")
  const [actualFile, setActualFile] = useState(null)
  const [fileName, setFileName] = useState("")
  const [index, setIndex] = useState(position?.index || 0)
  const [cueName, setCueName] = useState("")
  const [screen, setScreen] = useState(isAudioMode ? 0 : (position?.screen || 1))
  const [cueId, setCueId] = useState("")
  const [loop, setLoop] = useState(false)
  const [error, setError] = useState(null)
  const [color, setColor] = useState()
  const [selectedColor, setSelectedColor] = useState("#9244ff")
  const presetColors = ["#000000","#787878", "#c0c0c0", "#ffffff","#ff0000","#ff8000","#ffff00", "#80ff00", "#00ff00", "#00ff80", "#00ffff", "#0080ff", "#0000ff", "#7f00ff", "#ff00ff", "#ff007f",
      ]


  // Media pool states
  const [mediaFiles, setMediaFiles] = useState([])
  const [soundFiles, setSoundFiles] = useState([])
  const mediaFilesRef = useRef([])
  const mediaInputRef = useRef(null)
  const soundInputRef = useRef(null)

  const getInitialActiveTab = () => {
    if (typeof window === "undefined") return "media"

    const savedTab = window.localStorage.getItem("editModeMediaPoolActiveTab")
    if (savedTab === "colors" || savedTab === "media" || savedTab === "audio") {
      return savedTab
    }

    return "media"
  }

  const [activeTab, setActiveTab] = useState(getInitialActiveTab)

  const audioRow = getAudioRow(screenCount)

  const isAudioFile = () => isAudioMimeType(file?.type)

  useEffect(() => {
    if (position) {
      setIndex(position.index)
      setScreen(position.screen)
    }
  }, [position])

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("editModeMediaPoolActiveTab", activeTab)
    }
  }, [activeTab])

  useEffect(() => {
    mediaFilesRef.current = mediaFiles
  }, [mediaFiles])

  useEffect(() => {
    return () => {
      mediaFilesRef.current.forEach((media) => {
        if (media?.preview) {
          URL.revokeObjectURL(media.preview)
        }
      })
    }
  }, [])

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
  }, [screen, cues, cueData, isAudioMode, screenCount, position])

  useEffect(() => {
    if (cueData) {
      setCueName(cueData.name)
      setIndex(cueData.index)
      setScreen(cueData.screen)
      setCueId(cueData._id)
      setColor(cueData.color)

      const cueFile = cueData.file && typeof cueData.file === "object" ? cueData.file : null
      setFile("")
      setActualFile(cueFile)
      setFileName(cueFile?.name || "")
      setLoop(cueData.loop)
    } else {
      if (isAudioMode) {
        setFile("")
        setCueName("")
      } else {
        setFile("")
        setCueName("")
        setScreen(position?.screen || 1)
      }
    }
  }, [cueData, setCueName, setIndex, setScreen, setCueId, setFile, setColor, isAudioMode, position?.screen])

  const checkFileType = (file) => {
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

    if (file !== "") {
      if (!checkFileType(file)) {
        return
      }
    }


    if (isAudioMode || isAudioRow(screen, screenCount)) {
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

    if (!actualFile && file !== "") {
      if (!checkFileType(file)) {
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
      if (cueName === "" || cueName === fileName) {
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

  const getContrastTextColor = (hexColor) => {
    const current = (hexColor || "").replace("#", "")
    if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(current)) return "white"

    const normalized =
      current.length === 3
        ? current
            .split("")
            .map((char) => `${char}${char}`)
            .join("")
        : current

    const r = parseInt(normalized.slice(0, 2), 16)
    const g = parseInt(normalized.slice(2, 4), 16)
    const b = parseInt(normalized.slice(4, 6), 16)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000

    return brightness >= 186 ? "black" : "white"
  }

  // const tabStyles = {
  //   button: (isActive) => ({
  //     padding: "8px 16px",
  //     border: "none",
  //     backgroundColor: isActive ? "#9244ff" : "#D6BCFA",
  //     color: isActive ? "white" : "black",
  //     cursor: "pointer",
  //     fontWeight: isActive ? "bold" : "normal",
  //     borderRadius: isActive ? "4px 4px 0 0" : "4px",
  //     marginRight: "4px",
  //     transition: "all 0.2s",
  //     width: "100px",
  //   }),
  //   tabContent: {
  //     padding: "16px",
  //     backgroundColor: "#D6BCFA",
  //     borderRadius: "0 4px 4px 4px",
  //     minHeight: "200px",
  //     overflowY: "auto",
  //   },
  // }
  const tabStyles = {
    button: (isActive) => ({
      padding: "8px 16px",
      border: "none",
      backgroundColor: isActive ?  "#D6BCFA" : "#9244ff",
      color: !isActive ? "white" : "black",
      cursor: "pointer",
      fontWeight: isActive ? "bold" : "normal",
      borderRadius: "4px 4px 0 0",
      borderBottomLeftRadius: "0px",
      borderBottomRightRadius: "0px",
      transition: "all 0.2s",
      width: "100px",
    }),
    tabContent: {
      padding: "16px",
      backgroundColor: "#D6BCFA",
      borderRadius: "0 0 4px 4px",
      minHeight: "200px",
      overflowY: "auto",
    },
  }
  // form with inputs for cue name, index, screen number, file upload, and color selection. 
  // It also includes front end validation for file types and displays error messages when necessary. 
  // The form supports both adding new cues and editing existing cues, with appropriate handling for each case.
  return (
    <div className="cue-editor-form">

    <ChakraProvider theme={theme} >

      <form onSubmit={cueData ? handleUpdateSubmit : onAddCue}>
        <FormControl as="fieldset">
          {cueData ? (
            <Heading size="md" mb={4}>Edit Element</Heading>
          ) : (
            <Heading size="md" mb={4} color="white">Add element</Heading>
          )}

          <Box>
            <div class="cue-form-tabs">
              <Button
                onClick={() => setActiveTab("colors")}
                style={tabStyles.button(activeTab === "colors")}
                variant="unstyled"
              >
                Colors
              </Button>
              <Button
                onClick={() => setActiveTab("media")}
                style={tabStyles.button(activeTab === "media")}
                variant="unstyled"
              >
                Media
              </Button>
              <Button
                onClick={() => setActiveTab("audio")}
                style={tabStyles.button(activeTab === "audio")}
                variant="unstyled"
              >
                Audio
              </Button>
            </div>

            <Box style={tabStyles.tabContent}>
              {activeTab === "colors" && (
                <VStack spacing={4} align="stretch">
                  <FormHelperText color="black">
                    Select a color and drag it to the grid
                  </FormHelperText>

                  <ColorPickerWithPresets
                    color={selectedColor}
                    onChange={setSelectedColor}
                    presetColors={presetColors}
                  />
                  <FormHelperText mb={2} color="black">Element name</FormHelperText>
                    <Input
                      data-testid="cue-name"
                      id="cue-name"
                      value={cueName}
                      placeholder="Color Element"
                      mb={2}
                      color="black"
                      sx={{ color: "black !important", caretColor: "black" }}
                      _placeholder={{ color: "#acacac" }}
                      onChange={(e) => setCueName(e.target.value)}
                      required
                    />

                  <Box
                    className="droppable-color-element"
                    draggable={true}
                    onDragStart={(e) => {
                      suppressNativeDragGhost(e.dataTransfer)
                      const normalizedCueName = cueName.trim()
                      const dragData = {
                        type: "newCueFromForm",
                        cueName: normalizedCueName,
                        color: selectedColor || "#e014ee",
                        elementType: "color",
                      }

                      mediaStore.setActiveDragData(dragData)

                      e.dataTransfer.setData("application/json", JSON.stringify(dragData))
                      e.dataTransfer.setData("text/plain", JSON.stringify(dragData))
                    }}
                    onDragEnd={() => mediaStore.clearActiveDragData()}
                    p={6}
                    bg={selectedColor || "purple.100"}
                    border="2px dashed"
                    borderColor="purple.400"
                    borderRadius="md"
                    textAlign="center"
                    cursor="grab"
                    _active={{ cursor: "grabbing" }}
                    _hover={{ opacity: 0.8 }}
                  >
                    <Text color={getContrastTextColor(selectedColor)} fontWeight="bold">
                      Drag color to grid
                    </Text>
                  </Box>
                </VStack>
              )}

              {activeTab === "media" && (
                <VStack spacing={4} align="stretch" >
                  <FormHelperText color="black">
                    Upload images or videos and drag them to the grid
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
                      <Button variant="ghost" size="xs" marginLeft={2} color="black">
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
                    _hover={{ backgroundColor: "#b366ff" }}
                    color="black"
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
                              suppressNativeDragGhost(e.dataTransfer)
                              // Store the file in mediaStore so it can be retrieved on drop
                              mediaStore.addFile(media.id, media.file)
                              const dragData = {
                                type: "newCueFromForm",
                                cueName: media.name,
                                elementType: "media",
                                mediaId: media.id,
                                mimeType: media.type,
                                previewUrl: media.preview,
                              }
                              mediaStore.setActiveDragData(dragData)
                              
                              e.dataTransfer.setData("application/json", JSON.stringify(dragData))
                              e.dataTransfer.setData("text/plain", JSON.stringify(dragData))
                            }}
                            onDragEnd={() => mediaStore.clearActiveDragData()}
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
              )}

              {activeTab === "audio" && (
                <VStack spacing={4} align="stretch">
                  <FormHelperText color="black">
                    Upload audio files and drag them to the grid
                    <Tooltip
                      label={<><strong>Valid audio types: </strong> .mp3 and .wav</>}
                      placement="right-end"
                      p={2}
                      fontSize="sm"
                    >
                      <Button variant="ghost" size="xs" marginLeft={2} color="black">
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
                    color="black"
                  >
                    Upload Audio Files
                  </Button>

                  {soundFiles.length > 0 && (
                    <>
                      <Divider />
                      <Text fontWeight="bold" color="black">Sound Pool ({soundFiles.length})</Text>
                      <VStack spacing={2} align="stretch">
                        {soundFiles.map((sound) => (
                          <Box
                            key={sound.id}
                            draggable={true}
                            onDragStart={(e) => {
                              suppressNativeDragGhost(e.dataTransfer)
                              // Store the file in mediaStore so it can be retrieved on drop
                              mediaStore.addFile(sound.id, sound.file)
                              const dragData = {
                                type: "newCueFromForm",
                                cueName: sound.name,
                                elementType: "sound",
                                soundId: sound.id,
                                mimeType: sound.type,
                              }
                              mediaStore.setActiveDragData(dragData)
                              
                              e.dataTransfer.setData("application/json", JSON.stringify(dragData))
                              e.dataTransfer.setData("text/plain", JSON.stringify(dragData))
                            }}
                            onDragEnd={() => mediaStore.clearActiveDragData()}
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
                            <Box display="flex" alignItems="center" flex={1} color="black">
                              <SpeakerIcon boxSize="20px" mr={2} />
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
              )}
            </Box>
          </Box>


          {error && <Error error={error} />}
        </FormControl>
      </form>
    </ChakraProvider>
    </div>

  )
}

export default CuesForm
