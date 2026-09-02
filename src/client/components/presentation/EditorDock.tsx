import type React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import {
  Box,
  Button,
  ButtonGroup,
  HStack,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react"
import { AttachmentIcon, ViewIcon } from "@chakra-ui/icons"
import CuesForm from "./CuesForm"
import ScorePanel from "./ScorePanel"
import { useAppDispatch, useAppSelector } from "../../redux/hooks"
import { removeMedia, uploadMedia } from "../../redux/presentationReducer"

import type { Cue, CueUpdateInput, ScoreDocument } from "../../types"

type DockTab = "elements" | "scores"

const DOCK_WIDTH_KEY = "muvico.dockWidth"
const DOCK_MIN = 280
const DOCK_MAX = 760
const DOCK_DEFAULT = 380

function readStoredWidth(): number {
  try {
    const raw = localStorage.getItem(DOCK_WIDTH_KEY)
    const parsed = raw ? Number(raw) : NaN
    if (Number.isFinite(parsed) && parsed >= DOCK_MIN && parsed <= DOCK_MAX) {
      return parsed
    }
  } catch {}
  return DOCK_DEFAULT
}

interface EditorDockProps {
  presentationId: string
  scores: ScoreDocument[]
  addCue?: (cueData: CueUpdateInput) => void | Promise<void>
  onClose?: () => void
  position?: { index: number; screen: number } | null
  cues: Cue[]
  cueData?: Cue | null
  updateCue: (direction: "Next" | "Previous") => void
  screenCount: number
  isAudioMode?: boolean
  indexCount: number
}

const EditorDock = ({
  presentationId,
  scores,
  addCue,
  onClose,
  position,
  cues,
  cueData,
  updateCue,
  screenCount,
  isAudioMode,
  indexCount,
}: EditorDockProps) => {
  const dispatch = useAppDispatch()
  // The dock, not CuesForm, owns the store wiring: CuesForm is unit-tested
  // rendered standalone, with no Provider around it.
  const mediaLibrary = useAppSelector((state) => state.presentation.media)

  const handleUploadMedia = useCallback(
    (file: File) => dispatch(uploadMedia(presentationId, file)),
    [dispatch, presentationId]
  )

  const handleDeleteMedia = useCallback(
    (mediaId: string) => dispatch(removeMedia(presentationId, mediaId)),
    [dispatch, presentationId]
  )

  const [activeTab, setActiveTab] = useState<DockTab>("elements")
  const [dockWidth, setDockWidth] = useState<number>(readStoredWidth)
  const isDragging = useRef(false)
  const dragStartX = useRef(0)
  const dragStartWidth = useRef(0)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const tabBg = useColorModeValue("whiteAlpha.700", "blackAlpha.300")
  const activeBg = useColorModeValue("purple.500", "purple.300")
  const activeColor = useColorModeValue("white", "gray.900")
  const inactiveColor = useColorModeValue("gray.900", "whiteAlpha.900")
  const handleColor = useColorModeValue("purple.200", "purple.800")
  const handleHoverColor = useColorModeValue("purple.400", "purple.500")

  /* Persist width to localStorage */
  useEffect(() => {
    try {
      localStorage.setItem(DOCK_WIDTH_KEY, String(dockWidth))
    } catch {
      // ignore
    }
  }, [dockWidth])

  /* Override the CSS 20rem fixed width so the drag takes effect */
  useEffect(() => {
    const el = containerRef.current?.closest<HTMLElement>(".edit-mode-cue-form")
    if (!el) return
    el.style.width = `${dockWidth}px`
    el.style.minWidth = `${dockWidth}px`
    el.style.maxWidth = `${dockWidth}px`

    return () => {
      el.style.width = ""
      el.style.minWidth = ""
      el.style.maxWidth = ""
    }
  }, [dockWidth])

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return
    const delta = dragStartX.current - e.clientX
    const next = Math.min(
      DOCK_MAX,
      Math.max(DOCK_MIN, dragStartWidth.current + delta)
    )
    setDockWidth(next)
  }, [])

  const onMouseUp = useCallback(() => {
    if (!isDragging.current) return
    isDragging.current = false
    document.body.style.cursor = ""
    document.body.style.userSelect = ""
    document.removeEventListener("mousemove", onMouseMove)
    document.removeEventListener("mouseup", onMouseUp)
  }, [onMouseMove])

  const onHandleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      isDragging.current = true
      dragStartX.current = e.clientX
      dragStartWidth.current = dockWidth
      document.body.style.cursor = "col-resize"
      document.body.style.userSelect = "none"
      document.addEventListener("mousemove", onMouseMove)
      document.addEventListener("mouseup", onMouseUp)
    },
    [dockWidth, onMouseMove, onMouseUp]
  )

  return (
    <Box
      ref={containerRef}
      position="relative"
      height="100%"
      display="flex"
      flexDirection="column"
    >
      {/* ── Drag handle — left edge ────────────────────────────────────── */}
      <Box
        position="absolute"
        left={0}
        top={0}
        bottom={0}
        width="5px"
        zIndex={10}
        cursor="col-resize"
        bg={handleColor}
        transition="background 0.15s"
        _hover={{ bg: handleHoverColor }}
        onMouseDown={onHandleMouseDown}
        title="Drag to resize panel"
      />

      <VStack
        align="stretch"
        height="100%"
        spacing={3}
        overflow="hidden"
        pl="5px"
      >
        {/* ── Tab switcher ─────────────────────────────────────────────── */}
        <HStack justify="flex-end" align="center" px={2} pt={2}>
          <ButtonGroup isAttached size="sm" bg={tabBg} borderRadius="8px">
            <Button
              leftIcon={<AttachmentIcon />}
              bg={activeTab === "elements" ? activeBg : "transparent"}
              color={activeTab === "elements" ? activeColor : inactiveColor}
              onClick={() => setActiveTab("elements")}
            >
              Elements
            </Button>
            <Button
              leftIcon={<ViewIcon />}
              bg={activeTab === "scores" ? activeBg : "transparent"}
              color={activeTab === "scores" ? activeColor : inactiveColor}
              onClick={() => setActiveTab("scores")}
            >
              Scores
            </Button>
          </ButtonGroup>
        </HStack>

        {/* ── Tab content ──────────────────────────────────────────────── */}
        <Box
          flex="1"
          minH={0}
          width="100%"
          display="flex"
          flexDirection="column"
          overflow={activeTab === "scores" ? "hidden" : "auto"}
          p={activeTab === "scores" ? 2 : undefined}
        >
          {activeTab === "elements" ? (
            <CuesForm
              addCue={addCue}
              onClose={onClose}
              position={position}
              cues={cues}
              cueData={cueData}
              updateCue={updateCue}
              screenCount={screenCount}
              isAudioMode={isAudioMode}
              indexCount={indexCount}
              mediaLibrary={mediaLibrary}
              onUploadMedia={handleUploadMedia}
              onDeleteMedia={handleDeleteMedia}
            />
          ) : (
            <ScorePanel presentationId={presentationId} scores={scores} />
          )}
        </Box>
      </VStack>
    </Box>
  )
}

export default EditorDock
