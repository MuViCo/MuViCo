import React, { useEffect, useMemo, useState } from "react"
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Text,
  Textarea,
  Tooltip,
  useDisclosure,
  useToast,
} from "@chakra-ui/react"
import {
  FiEdit2,
  FiFileText,
  FiGrid,
  FiList,
  FiMonitor,
  FiSearch,
  FiTrash2,
} from "react-icons/fi"
import { motion } from "framer-motion"

import type { ChangeEvent, KeyboardEvent, MouseEvent, ReactNode } from "react"
import type { Cue, Presentation, UpdatePresentationInput } from "../../types"

type EditPresentation = (
  presentationId: string,
  updated: UpdatePresentationInput
) => Promise<void>

type ViewMode = "grid" | "list"
type SortMode = "recent" | "name"

interface EditModalProps {
  isOpen: boolean
  onClose: () => void
  presentation: Presentation | null
  handleEditPresentation?: EditPresentation
}

interface PresentationsGridProps {
  presentations: Presentation[]
  handlePresentationClick: (presentationId: string) => void
  handleDeletePresentation?: (presentationId: string) => void
  handleEditPresentation?: EditPresentation
  headerActions?: ReactNode
}

const previewPalettes = [
  ["#24303f", "#1c2634"],
  ["#33283f", "#2a2035"],
  ["#4a4436", "#3d3830"],
  ["#263a34", "#1f302b"],
  ["#3d2b2b", "#322323"],
]

const getTimestamp = (presentation: Presentation) => {
  const value =
    presentation.lastUsed || presentation.updatedAt || presentation.createdAt
  const timestamp = new Date(value || 0).getTime()
  return Number.isNaN(timestamp) ? 0 : timestamp
}

const formatRelativeDate = (presentation: Presentation) => {
  const timestamp = getTimestamp(presentation)
  if (!timestamp) return "Recently"

  const elapsed = Math.max(0, Date.now() - timestamp)
  const minutes = Math.floor(elapsed / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes} min ago`
  if (hours < 24) return `${hours} h ago`
  if (days === 1) return "Yesterday"
  if (days < 30) return `${days} days ago`
  if (days < 365) return `${Math.floor(days / 30)} months ago`
  return `${Math.floor(days / 365)} years ago`
}

const getPreviewCue = (presentation: Presentation) =>
  presentation.previewCue ||
  [...(presentation.cues || [])]
    .filter(
      (cue) =>
        cue.cueType !== "audio" &&
        (Number(cue.screen) === 1 || cue.spanScreens?.includes(1))
    )
    .sort(
      (first, second) =>
        Number(first.index) - Number(second.index) ||
        Number(first.layer ?? 0) - Number(second.layer ?? 0)
    )[0]

const getPreviewBackground = (presentation: Presentation, previewCue?: Cue) => {
  const colorCue = previewCue?.file
    ? undefined
    : previewCue ||
      presentation.cues?.find(
        (cue) => cue.cueType !== "audio" && !cue.file && cue.color
      )
  if (colorCue?.color) return colorCue.color

  const hash = Array.from(presentation.name || "").reduce(
    (total, character) => total + character.charCodeAt(0),
    0
  )
  const [first, second] = previewPalettes[hash % previewPalettes.length]
  return `repeating-linear-gradient(135deg, ${first} 0 12px, ${second} 12px 24px)`
}

const getPresentationMeta = (presentation: Presentation) => {
  const screenCount = Number(presentation.screenCount) || 1
  const frameCount = Number(presentation.indexCount) || 0
  const cueCount = presentation.cues?.length || 0
  const score = presentation.scores?.[0]
  const scoreName = score?.title || score?.file?.name || "No score"
  const previewCue = getPreviewCue(presentation)
  const previewUrl = previewCue?.file?.url
  const previewType = previewCue?.file?.type || ""
  const previewName = previewCue?.file?.name || ""
  const isVideoPreview =
    previewType.startsWith("video/") ||
    /\.(mp4|webm|mov|m4v|ogv)$/i.test(previewName)

  return {
    screenCount,
    frameCount,
    cueCount,
    scoreName,
    hasScore: Boolean(score),
    updatedLabel: formatRelativeDate(presentation),
    previewBackground: getPreviewBackground(presentation, previewCue),
    previewUrl,
    isVideoPreview,
    previewOpacity: previewCue?.opacity ?? 1,
  }
}

const PreviewMedia = ({
  name,
  url,
  isVideo,
  opacity,
}: {
  name: string
  url?: string
  isVideo: boolean
  opacity: number
}) => {
  if (!url) return null

  return isVideo ? (
    <video
      className="presentation-preview-media"
      src={url}
      aria-label={`Preview of ${name}`}
      preload="metadata"
      muted
      playsInline
      style={{ opacity }}
    />
  ) : (
    <img
      className="presentation-preview-media"
      src={url}
      alt={`Preview of ${name}`}
      loading="lazy"
      style={{ opacity }}
    />
  )
}

const EditModal = ({
  isOpen,
  onClose,
  presentation,
  handleEditPresentation,
}: EditModalProps) => {
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [saveError, setSaveError] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const toast = useToast()

  const handleDescriptionChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = event.target.value

    if (nextValue.length > 500) {
      const toastId = "description-limit-toast"
      if (!toast.isActive(toastId)) {
        toast({
          id: toastId,
          title: "Description too long",
          description: "Description cannot exceed 500 characters.",
          status: "warning",
          duration: 3000,
          isClosable: true,
        })
      }
      return
    }

    setEditDescription(nextValue)
  }

  useEffect(() => {
    if (isOpen && presentation) {
      setEditName(presentation.name || "")
      setEditDescription(presentation.description || "")
      setSaveError("")
    }
  }, [isOpen, presentation])

  const handleClose = () => {
    if (!isSaving) onClose()
  }

  const handleSaveEdit = async () => {
    const trimmedName = editName.trim()
    if (!trimmedName || !presentation?.id || !handleEditPresentation) return

    setSaveError("")
    setIsSaving(true)
    try {
      await handleEditPresentation(presentation.id, {
        name: trimmedName,
        description: editDescription,
      })
      onClose()
    } catch (error) {
      setSaveError("Failed to save presentation. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal isCentered isOpen={isOpen} onClose={handleClose}>
      <ModalOverlay backdropFilter="blur(8px)" />
      <ModalContent className="presentation-edit-modal">
        <ModalHeader>Edit presentation</ModalHeader>
        <ModalCloseButton isDisabled={isSaving} />
        <ModalBody>
          <FormControl mb={4} isRequired>
            <FormLabel>Title</FormLabel>
            <Input
              value={editName}
              onChange={(event) => setEditName(event.target.value)}
              maxLength={100}
            />
          </FormControl>
          <FormControl>
            <FormLabel>Description</FormLabel>
            <Textarea
              placeholder="Max. 500 characters"
              value={editDescription}
              onChange={handleDescriptionChange}
            />
          </FormControl>
          {saveError && (
            <Text mt={3} color="red.400" role="alert">
              {saveError}
            </Text>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            mr={3}
            variant="muvico-secondary"
            onClick={handleClose}
            isDisabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            variant="muvico-primary"
            onClick={handleSaveEdit}
            isLoading={isSaving}
            isDisabled={!editName.trim()}
          >
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

const PresentationsGrid = ({
  presentations,
  handlePresentationClick,
  handleDeletePresentation,
  handleEditPresentation,
  headerActions,
}: PresentationsGridProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const storedMode = localStorage.getItem("presentationsLayoutMode")
    return storedMode === "grid" || storedMode === "list" ? storedMode : "list"
  })
  const [sortMode, setSortMode] = useState<SortMode>("recent")
  const [searchQuery, setSearchQuery] = useState("")
  const [editingPresentation, setEditingPresentation] =
    useState<Presentation | null>(null)

  useEffect(() => {
    localStorage.setItem("presentationsLayoutMode", viewMode)
  }, [viewMode])

  const visiblePresentations = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase()
    const filtered = presentations.filter((presentation) => {
      if (!normalizedQuery) return true
      return `${presentation.name || ""} ${presentation.description || ""}`
        .toLocaleLowerCase()
        .includes(normalizedQuery)
    })

    return filtered.sort((first, second) => {
      if (sortMode === "name") {
        return (first.name || "").localeCompare(second.name || "", undefined, {
          sensitivity: "base",
        })
      }
      return getTimestamp(second) - getTimestamp(first)
    })
  }, [presentations, searchQuery, sortMode])

  const openEditModal = (presentation: Presentation, event: MouseEvent) => {
    event.stopPropagation()
    setEditingPresentation(presentation)
    onOpen()
  }

  const handleCloseEditModal = () => {
    onClose()
    setEditingPresentation(null)
  }

  const handleCardKeyDown = (event: KeyboardEvent, presentationId: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      handlePresentationClick(presentationId)
    }
  }

  const deletePresentation = (presentationId: string, event: MouseEvent) => {
    event.stopPropagation()
    handleDeletePresentation?.(presentationId)
  }

  const renderActions = (presentation: Presentation, compact = false) => (
    <Flex className="presentation-item-actions">
      <Tooltip label="Edit presentation">
        <IconButton
          icon={<Icon as={FiEdit2} />}
          size={compact ? "xs" : "sm"}
          variant="muvico-secondary"
          aria-label="Edit presentation"
          onClick={(event) => openEditModal(presentation, event)}
        />
      </Tooltip>
      <Tooltip label="Delete presentation">
        <IconButton
          icon={<Icon as={FiTrash2} />}
          size={compact ? "xs" : "sm"}
          variant="muvico-secondary"
          className="presentation-delete-button"
          aria-label="Delete presentation"
          onClick={(event) => deletePresentation(presentation.id, event)}
        />
      </Tooltip>
    </Flex>
  )

  const renderGrid = () => (
    <SimpleGrid
      className="presentations-card-grid"
      id="presentations-grid"
      minH="280px"
    >
      {visiblePresentations.map((presentation) => {
        const meta = getPresentationMeta(presentation)
        return (
          <motion.div
            key={presentation.id}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.15 }}
          >
            <Box
              className="presentation-card"
              role="button"
              tabIndex={0}
              onClick={() => handlePresentationClick(presentation.id)}
              onKeyDown={(event) => handleCardKeyDown(event, presentation.id)}
            >
              <Box
                className="presentation-card-preview"
                style={{ background: meta.previewBackground }}
              >
                <PreviewMedia
                  name={presentation.name}
                  url={meta.previewUrl}
                  isVideo={meta.isVideoPreview}
                  opacity={meta.previewOpacity}
                />
                <Box className="presentation-screen-badge">
                  <Icon as={FiMonitor} />
                  {meta.screenCount}{" "}
                  {meta.screenCount === 1 ? "screen" : "screens"}
                </Box>
                {meta.hasScore && (
                  <Box className="presentation-score-badge">
                    <Icon as={FiFileText} />
                    <Text as="span">{meta.scoreName}</Text>
                  </Box>
                )}
                {renderActions(presentation, true)}
              </Box>
              <Box className="presentation-card-body">
                <Heading as="h2" size="sm" title={presentation.name}>
                  {presentation.name}
                </Heading>
                <Text className="presentation-card-description">
                  {presentation.description || "No description"}
                </Text>
                <Flex className="presentation-card-meta">
                  <Text>
                    {meta.frameCount} frames · {meta.cueCount} cues
                  </Text>
                  <Text>{meta.updatedLabel}</Text>
                </Flex>
              </Box>
            </Box>
          </motion.div>
        )
      })}
    </SimpleGrid>
  )

  const renderList = () => (
    <Box id="presentations-grid" role="list" className="presentations-list">
      <Box className="presentations-list-header" aria-hidden="true">
        <Text>Preview</Text>
        <Text>Name</Text>
        <Text>Content</Text>
        <Text>Score</Text>
        <Text>Modified</Text>
        <Box />
      </Box>
      {visiblePresentations.map((presentation) => {
        const meta = getPresentationMeta(presentation)
        return (
          <motion.div
            key={presentation.id}
            whileHover={{ x: 2 }}
            transition={{ duration: 0.15 }}
          >
            <Box
              role="listitem"
              className="presentation-list-item"
              tabIndex={0}
              onClick={() => handlePresentationClick(presentation.id)}
              onKeyDown={(event) => handleCardKeyDown(event, presentation.id)}
            >
              <Box
                className="presentation-list-preview"
                style={{ background: meta.previewBackground }}
              >
                <PreviewMedia
                  name={presentation.name}
                  url={meta.previewUrl}
                  isVideo={meta.isVideoPreview}
                  opacity={meta.previewOpacity}
                />
                <Text>{meta.screenCount}</Text>
              </Box>
              <Box className="presentation-list-identity">
                <Heading as="h2" size="sm" title={presentation.name}>
                  {presentation.name}
                </Heading>
                <Text>{presentation.description || "No description"}</Text>
              </Box>
              <Text className="presentation-list-content">
                {meta.frameCount} frames <span>·</span> {meta.cueCount} cues
              </Text>
              <Box
                className={`presentation-list-score ${
                  meta.hasScore ? "has-score" : ""
                }`}
              >
                <Icon as={FiFileText} />
                <Text as="span" title={meta.scoreName}>
                  {meta.scoreName}
                </Text>
              </Box>
              <Text className="presentation-list-date">
                {meta.updatedLabel}
              </Text>
              {renderActions(presentation)}
            </Box>
          </motion.div>
        )
      })}
    </Box>
  )

  return (
    <Box className="presentations-browser">
      <Flex className="presentations-browser-header">
        <Box>
          <Heading as="h1">Presentations</Heading>
          <Text>
            {presentations.length}{" "}
            {presentations.length === 1 ? "project" : "projects"}
          </Text>
        </Box>
        {headerActions}
      </Flex>

      <Flex className="presentations-toolbar">
        <InputGroup className="presentations-search">
          <InputLeftElement pointerEvents="none">
            <Icon as={FiSearch} />
          </InputLeftElement>
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search presentations..."
            aria-label="Search presentations"
          />
        </InputGroup>

        <Flex className="presentations-segmented-control">
          <Button
            onClick={() => setSortMode("recent")}
            aria-pressed={sortMode === "recent"}
            data-active={sortMode === "recent" ? "true" : undefined}
          >
            Recent
          </Button>
          <Button
            onClick={() => setSortMode("name")}
            aria-pressed={sortMode === "name"}
            data-active={sortMode === "name" ? "true" : undefined}
          >
            A → Z
          </Button>
        </Flex>

        <Flex className="presentations-segmented-control presentations-view-control">
          <Tooltip label="Grid view">
            <IconButton
              icon={<Icon as={FiGrid} />}
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
              aria-pressed={viewMode === "grid"}
              data-active={viewMode === "grid" ? "true" : undefined}
              data-testid="grid-button"
            />
          </Tooltip>
          <Tooltip label="List view">
            <IconButton
              icon={<Icon as={FiList} />}
              onClick={() => setViewMode("list")}
              aria-label="List view"
              aria-pressed={viewMode === "list"}
              data-active={viewMode === "list" ? "true" : undefined}
              data-testid="list-button"
            />
          </Tooltip>
        </Flex>
      </Flex>

      {visiblePresentations.length === 0 ? (
        <Box className="presentations-empty-state">
          <Icon as={FiMonitor} />
          <Heading size="sm">
            {presentations.length === 0
              ? "No presentations yet"
              : "No matching presentations"}
          </Heading>
          <Text>
            {presentations.length === 0
              ? "Create a presentation to start building your show."
              : "Try another name or description."}
          </Text>
        </Box>
      ) : viewMode === "grid" ? (
        renderGrid()
      ) : (
        renderList()
      )}

      <EditModal
        isOpen={isOpen}
        onClose={handleCloseEditModal}
        presentation={editingPresentation}
        handleEditPresentation={handleEditPresentation}
      />
    </Box>
  )
}

export default PresentationsGrid
