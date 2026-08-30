/**
 * CuesForm component for adding and editing cues in the presentation
 *
 * This component is used in the presentation editor to allow users to add new cues or edit existing cues.
 * It supports both visual cues (images and videos) and audio cues, with validation for file types and required fields.
 * The form includes inputs for cue name, index, screen number, file upload, and color selection.
 * It also provides feedback on file selection and displays error messages for invalid inputs.
 *
 * TODO: this component now doubles as the always-visible "media pool" sidebar (upload + drag-to-grid
 * via mediaStore). The original <form onSubmit> path below it (onAddCue / handleUpdateSubmit, and the
 * addCue/onClose/position/cueData/isAudioMode props) is NOT reachable from
 * the running app: EditModeContainer.jsx never receives real values for these from index.jsx, so they
 * arrive as no-ops. It's a leftover from a pre-rewrite design where CuesForm was opened via a
 * Toolbox/Drawer modal (see git history around "started the editor building from scratch") before being
 * repurposed into this sidebar. It's still directly unit-tested in isolation (cues.test.js, the
 * submit-flow tests), and some state (e.g. cueName) is shared with the live drag-and-drop code, so
 * removing it isn't a clean deletion. The dead code needs to be either removed or utilized in a new way,
 * for example a new form for editing existing cues in the grid.
 */

import {
  FormControl,
  FormHelperText,
  Input,
  Button,
  Heading,
  Divider,
  Tooltip,
  Box,
  VStack,
  HStack,
  Text,
  SimpleGrid,
  Image,
  IconButton,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from "@chakra-ui/react"
import { InfoOutlineIcon, DeleteIcon } from "@chakra-ui/icons"
import { SpeakerIcon } from "../../lib/icons"
import { useState, useEffect, useRef } from "react"
import Error from "../utils/Error"
import { getNextAvailableIndex } from "../utils/numberInputUtils"
import { ColorPickerWithPresets } from "./ColorPicker"
import {
  isAudioMimeType,
  getAudioRow,
  isAudioRow,
  getAllowedMimeTypesForScreen,
} from "../utils/fileTypeUtils"
import mediaStore from "./mediaFileStore"

// Create a transparent 1x1 pixel image to suppress the default browser drag ghost image
const transparentDragImage = (() => {
  if (typeof document === "undefined") {
    return null
  }

  const canvas = document.createElement("canvas")
  canvas.width = 1
  canvas.height = 1
  return canvas
})()

// Suppress the native browser drag ghost by setting it to the transparent image
const suppressNativeDragGhost = (dataTransfer) => {
  if (!dataTransfer?.setDragImage || !transparentDragImage) {
    return
  }

  dataTransfer.setDragImage(transparentDragImage, 0, 0)
}

/**
 * CuesForm component - a form for adding and editing presentation cues
 * Props:
 * - addCue: Function to add a new cue
 * - onClose: Function to close the form
 * - position: Current position/index of the cue being edited
 * - cues: Array of existing cues
 * - cueData: Cue data when editing (null when adding new)
 * - updateCue: Function to update an existing cue
 * - screenCount: Total number of screens in the presentation
 * - isAudioMode: Boolean indicating if in audio mode
 * - indexCount: Count of indices
 */
const CuesForm = ({
  addCue,
  onClose,
  position,
  cues,
  cueData,
  updateCue,
  screenCount,
  isAudioMode = false,
  indexCount,
}) => {
  const [file, setFile] = useState("")
  const [actualFile, setActualFile] = useState(null)
  const [fileName, setFileName] = useState("")
  const [index, setIndex] = useState(position?.index || 0)
  const [cueName, setCueName] = useState("")
  const [screen, setScreen] = useState(isAudioMode ? 0 : position?.screen || 1)
  const [cueId, setCueId] = useState("")
  const [loop, setLoop] = useState(false)
  const [continuePlayback, setContinuePlayback] = useState(false)
  const [error, setError] = useState(null)
  const [color, setColor] = useState()
  const [selectedColor, setSelectedColor] = useState("#9244ff")
  const presetColors = [
    "#000000",
    "#787878",
    "#c0c0c0",
    "#ffffff",
    "#ff0000",
    "#ff8000",
    "#ffff00",
    "#80ff00",
    "#00ff00",
    "#00ff80",
    "#00ffff",
    "#0080ff",
    "#0000ff",
    "#7f00ff",
    "#ff00ff",
    "#ff007f",
  ]

  // Media pool management state - for uploading and displaying media/audio files before adding to cue
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

  // Update form fields when position changes
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

  // Auto-calculate the next available index when adding a new cue
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

      const cueFile =
        cueData.file && typeof cueData.file === "object" ? cueData.file : null
      setFile("")
      setActualFile(cueFile)
      setFileName(cueFile?.name || "")
      setLoop(Boolean(cueData.loop))
      setContinuePlayback(Boolean(cueData.continuePlayback))
    } else {
      setLoop(false)
      setContinuePlayback(false)
      if (isAudioMode) {
        setFile("")
        setCueName("")
      } else {
        setFile("")
        setCueName("")
        setScreen(position?.screen || 1)
      }
    }
  }, [
    cueData,
    setCueName,
    setIndex,
    setScreen,
    setCueId,
    setFile,
    setColor,
    setLoop,
    setContinuePlayback,
    isAudioMode,
    position?.screen,
  ])

  const checkFileType = (file) => {
    if (!file || !file.type) {
      return false
    }

    const targetScreen = isAudioMimeType(file.type) ? audioRow : screen
    const allowedMimeTypes = getAllowedMimeTypesForScreen(
      targetScreen,
      screenCount
    )

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

  // Handle adding a new cue - validates and calls addCue callback
  const onAddCue = (event) => {
    event.preventDefault()

    if (file !== "") {
      if (!checkFileType(file)) {
        return
      }
    }

    // Additional validation for audio mode
    if (isAudioMode || isAudioRow(screen, screenCount)) {
      if (!isAudioFile()) {
        setError("Please select a valid audio file for the audio cue")
        setTimeout(() => setError(null), 5000)
        return
      }
    }

    addCue({
      file,
      index,
      cueName,
      screen,
      fileName,
      color,
      loop,
      continuePlayback,
    })

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
      loop,
      continuePlayback,
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

  // Handle uploading images/videos to media pool - creates preview URLs for drag-and-drop
  const handleMediaUpload = (event) => {
    const files = Array.from(event.target.files)
    const validMediaFiles = files.filter((file) => {
      const isImage = file.type.startsWith("image/")
      const isVideo = file.type.startsWith("video/")
      return isImage || isVideo
    })

    // Create media objects with preview URLs
    const newMediaFiles = validMediaFiles.map((file, idx) => ({
      id: `media-${Date.now()}-${idx}`,
      file,
      name: file.name,
      type: file.type,
      preview: URL.createObjectURL(file),
    }))

    setMediaFiles((prev) => [...prev, ...newMediaFiles])
  }

  const handleSoundUpload = (event) => {
    const files = Array.from(event.target.files)
    const validAudioFiles = files.filter((file) => isAudioMimeType(file.type))

    // Create sound objects
    const newSoundFiles = validAudioFiles.map((file, idx) => ({
      id: `sound-${Date.now()}-${idx}`,
      file,
      name: file.name,
      type: file.type,
    }))

    setSoundFiles((prev) => [...prev, ...newSoundFiles])
  }

  const removeMediaFile = (id) => {
    setMediaFiles((prev) => {
      const file = prev.find((f) => f.id === id)
      if (file?.preview) {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter((f) => f.id !== id)
    })
  }

  const removeSoundFile = (id) => {
    setSoundFiles((prev) => prev.filter((f) => f.id !== id))
  }

  // Calculate contrasting text color (black or white) based on background color brightness
  const getContrastTextColor = (hexColor) => {
    const current = (hexColor || "").replace("#", "")
    // Validate hex color format
    if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(current)) return "white"

    // Normalize 3-char hex to 6-char
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

  const surfaceBg = useColorModeValue("gray.50", "#140f1a")
  const borderColor = useColorModeValue("purple.200", "whiteAlpha.200")
  const textColor = useColorModeValue("gray.800", "whiteAlpha.900")
  const mutedText = useColorModeValue("gray.600", "whiteAlpha.500")

  const activeTabBg = surfaceBg
  const activeTabColor = textColor
  const inactiveTabBg = "transparent"
  const inactiveTabColor = mutedText
  const tabHoverBg = useColorModeValue("blackAlpha.50", "whiteAlpha.50")

  // Render the form with three tabs: Colors, Media, and Audio
  // The colors tab allows creating colored elements by dragging them to the grid
  // The media tab allows uploading and dragging images/videos to the grid
  // The audio tab allows uploading and dragging audio files to the grid
  return (
    <div className="cue-editor-form custom-scrollbar">
      <form
        onSubmit={cueData ? handleUpdateSubmit : onAddCue}
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          minHeight: 0,
          width: "100%",
        }}
      >
        <FormControl
          as="fieldset"
          display="flex"
          flexDirection="column"
          height="100%"
          minH={0}
          width="100%"
        >
          <Box px={1} pb={3} flexShrink={0}>
            <Heading size="sm" color={textColor}>
              {cueData ? "Edit element" : "Add element"}
            </Heading>
          </Box>

          <Tabs
            index={["colors", "media", "audio"].indexOf(activeTab)}
            onChange={(idx) => setActiveTab(["colors", "media", "audio"][idx])}
            variant="enclosed"
            size="sm"
            display="flex"
            flexDirection="column"
            flex="1 1 0"
            minHeight={0}
          >
            <TabList flexShrink={0} borderColor={borderColor}>
              {["Colors", "Media", "Audio"].map((tabLabel, idx) => {
                const tabId = tabLabel.toLowerCase()
                const isActive = activeTab === tabId
                return (
                  <Tab
                    key={tabId}
                    _selected={{
                      color: activeTabColor,
                      bg: activeTabBg,
                      borderColor: borderColor,
                      borderBottomColor: "transparent",
                    }}
                    color={inactiveTabColor}
                    bg={inactiveTabBg}
                    flex="1"
                    borderTopRadius="md"
                    borderBottomRadius="0"
                    marginRight={idx < 2 ? "1px" : "0"}
                    _hover={{
                      bg: isActive ? activeTabBg : tabHoverBg,
                      color: textColor,
                    }}
                    fontWeight={isActive ? "bold" : "normal"}
                  >
                    {tabLabel}
                  </Tab>
                )
              })}
            </TabList>

            <TabPanels
              flex="1 1 0"
              minHeight={0}
              overflowY="auto"
              bg={surfaceBg}
              border="1px solid"
              borderColor={borderColor}
              borderTop="none"
              borderBottomRadius="md"
              sx={{
                "&::-webkit-scrollbar": { width: "8px" },
                "&::-webkit-scrollbar-track": {
                  bg: useColorModeValue("blackAlpha.50", "whiteAlpha.50"),
                  borderRadius: "4px",
                },
                "&::-webkit-scrollbar-thumb": {
                  bg: useColorModeValue("blackAlpha.300", "whiteAlpha.300"),
                  borderRadius: "4px",
                },
              }}
            >
              <TabPanel p={3}>
                <VStack spacing={3} align="stretch">
                  <FormHelperText color={mutedText} mt={0}>
                    Select a color and drag it to the grid
                  </FormHelperText>

                  <ColorPickerWithPresets
                    color={selectedColor}
                    onChange={setSelectedColor}
                    presetColors={presetColors}
                  />
                  <Input
                    variant="flushed"
                    data-testid="cue-name"
                    id="cue-name"
                    value={cueName}
                    placeholder="Element name"
                    color={textColor}
                    borderColor={useColorModeValue(
                      "blackAlpha.300",
                      "whiteAlpha.300"
                    )}
                    _focus={{
                      borderColor: useColorModeValue(
                        "purple.500",
                        "purple.300"
                      ),
                    }}
                    _placeholder={{ color: mutedText }}
                    sx={{ caretColor: "currentColor" }}
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
                        opacity: 1,
                        elementType: "color",
                      }

                      mediaStore.setActiveDragData(dragData)

                      e.dataTransfer.setData(
                        "application/json",
                        JSON.stringify(dragData)
                      )
                      e.dataTransfer.setData(
                        "text/plain",
                        JSON.stringify(dragData)
                      )
                    }}
                    onDragEnd={() => mediaStore.clearActiveDragData()}
                    p={3}
                    mt={1}
                    bg={selectedColor || "purple.500"}
                    borderRadius="md"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    cursor="grab"
                    _active={{ cursor: "grabbing", transform: "scale(0.98)" }}
                    _hover={{ opacity: 0.9 }}
                    boxShadow="0 4px 12px rgba(0,0,0,0.2)"
                    transition="all 0.1s"
                  >
                    <Box
                      mr={2}
                      opacity={0.8}
                      color={getContrastTextColor(selectedColor)}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle cx="5" cy="3" r="1.5" />
                        <circle cx="5" cy="8" r="1.5" />
                        <circle cx="5" cy="13" r="1.5" />
                        <circle cx="11" cy="3" r="1.5" />
                        <circle cx="11" cy="8" r="1.5" />
                        <circle cx="11" cy="13" r="1.5" />
                      </svg>
                    </Box>
                    <Text
                      color={getContrastTextColor(selectedColor)}
                      fontWeight="bold"
                      fontSize="sm"
                    >
                      Drag to grid
                    </Text>
                  </Box>
                </VStack>
              </TabPanel>

              <TabPanel p={3}>
                <VStack spacing={4} align="stretch">
                  <FormHelperText color={mutedText}>
                    Upload images or videos and drag them to the grid
                    <Tooltip
                      label={
                        <>
                          <strong>Valid image types: </strong>.apng, .avif,
                          .bmp, .cur, .gif, .ico, .jfif, .jpe, .jpeg, .jpg,
                          .png, .svg and .webp
                          <br />
                          <strong>Valid video types: </strong> .mp4 and .3gp
                        </>
                      }
                      placement="right-end"
                      p={2}
                      fontSize="sm"
                    >
                      <Button
                        variant="ghost"
                        size="xs"
                        marginLeft={2}
                        color={mutedText}
                      >
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
                      <Text fontWeight="bold" color={textColor}>
                        Media Pool ({mediaFiles.length})
                      </Text>
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

                              e.dataTransfer.setData(
                                "application/json",
                                JSON.stringify(dragData)
                              )
                              e.dataTransfer.setData(
                                "text/plain",
                                JSON.stringify(dragData)
                              )
                            }}
                            onDragEnd={() => mediaStore.clearActiveDragData()}
                            position="relative"
                            border="2px solid"
                            borderColor="purple.300"
                            borderRadius="md"
                            p={2}
                            cursor="grab"
                            _active={{ cursor: "grabbing" }}
                            _hover={{
                              borderColor: "purple.500",
                              bg: "whiteAlpha.100",
                            }}
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
                              <Box
                                bg="whiteAlpha.200"
                                p={4}
                                textAlign="center"
                                borderRadius="md"
                              >
                                <Text fontSize="2xl">🎥</Text>
                              </Box>
                            )}
                            <Text
                              fontSize="xs"
                              mt={1}
                              noOfLines={1}
                              color={textColor}
                            >
                              {media.name}
                            </Text>
                          </Box>
                        ))}
                      </SimpleGrid>
                    </>
                  )}
                </VStack>
              </TabPanel>

              <TabPanel p={3}>
                <VStack spacing={4} align="stretch">
                  <FormHelperText color={mutedText}>
                    Upload audio files and drag them to the grid
                    <Tooltip
                      label={
                        <>
                          <strong>Valid audio types: </strong> .mp3 and .wav
                        </>
                      }
                      placement="right-end"
                      p={2}
                      fontSize="sm"
                    >
                      <Button
                        variant="ghost"
                        size="xs"
                        marginLeft={2}
                        color={mutedText}
                      >
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
                      <Text fontWeight="bold" color={textColor}>
                        Sound Pool ({soundFiles.length})
                      </Text>
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

                              e.dataTransfer.setData(
                                "application/json",
                                JSON.stringify(dragData)
                              )
                              e.dataTransfer.setData(
                                "text/plain",
                                JSON.stringify(dragData)
                              )
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
                            _hover={{
                              borderColor: "purple.500",
                              bg: "whiteAlpha.100",
                            }}
                          >
                            <Box
                              display="flex"
                              alignItems="center"
                              flex={1}
                              color={textColor}
                            >
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
              </TabPanel>
            </TabPanels>
          </Tabs>

          {error && <Error error={error} />}
        </FormControl>
      </form>
    </div>
  )
}

export default CuesForm
