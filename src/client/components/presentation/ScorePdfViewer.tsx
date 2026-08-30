import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { ChangeEvent, KeyboardEvent as ReactKeyboardEvent } from "react"
import {
  Box,
  Button,
  HStack,
  IconButton,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Select,
  Spinner,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
} from "@chakra-ui/icons"
import getToken from "../../auth"

import type {
  PDFDocumentLoadingTask,
  PDFDocumentProxy,
  RenderTask,
} from "pdfjs-dist/types/src/pdf"
import type { ScoreDocument, ScoreMarker } from "../../types"
import ScoreMarkerOverlay from "./ScoreMarkerOverlay"
import { useAppDispatch, useAppSelector } from "../../redux/hooks"
import { useCustomToast } from "../utils/toastUtils"
import {
  createScoreMarker,
  deleteScoreMarker,
  updateScoreMarker,
} from "../../redux/presentationReducer"

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

const MAX_ZOOM = 3.0
const MIN_ZOOM = 0.3
const THUMB_WIDTH = 52
const THUMB_COL_WIDTH = 68
const THUMB_HIDE_THRESHOLD = 340
const FALLBACK_ZOOM = 1.0

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v))
const getScoreUrl = (s: ScoreDocument) => s.file?.url ?? s.sourceUrl

// Either placing a new marker, or editing/deleting an existing one.
type MarkerFormState =
  | { mode: "placing"; x: number; y: number }
  | { mode: "editing"; marker: ScoreMarker }

/* -------------------------------------------------------------------------- */
/*  PdfCanvas — main page canvas                                               */
/* -------------------------------------------------------------------------- */

interface PdfCanvasProps {
  pdf: PDFDocumentProxy
  pageNumber: number
  scale: number
  background: string
  testId?: string
  markers?: ScoreMarker[]
  isPlacingMarker?: boolean
  onPlaceMarker?: (x: number, y: number) => void
  onSelectMarker?: (marker: ScoreMarker) => void
  onDeleteMarker?: (markerId: string) => void
  markerForm?: MarkerFormState | null
  markerFrameInput?: string
  indexCount?: number
  onMarkerFrameInputChange?: (value: string) => void
  onConfirmMarker?: () => void
  onCancelMarker?: () => void
  highlightedMarkerId?: string | null
}

const PdfCanvas = ({
  pdf,
  pageNumber,
  scale,
  background,
  testId,
  markers = [],
  isPlacingMarker = false,
  onPlaceMarker,
  onSelectMarker,
  onDeleteMarker,
  markerForm = null,
  markerFrameInput = "",
  indexCount = 0,
  onMarkerFrameInputChange,
  onConfirmMarker,
  onCancelMarker,
  highlightedMarkerId = null,
}: PdfCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isRendering, setIsRendering] = useState(false)

  useEffect(() => {
    let cancelled = false
    let renderTask: RenderTask | null = null

    const run = async () => {
      const canvas = canvasRef.current
      if (!canvas) return
      setIsRendering(true)
      try {
        const page = await pdf.getPage(pageNumber)
        if (cancelled) return
        const vp = page.getViewport({ scale })
        const dpr = window.devicePixelRatio || 1
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        canvas.width = Math.floor(vp.width * dpr)
        canvas.height = Math.floor(vp.height * dpr)
        canvas.style.width = `${Math.floor(vp.width)}px`
        canvas.style.height = `${Math.floor(vp.height)}px`
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        renderTask = page.render({
          canvasContext: ctx,
          viewport: vp,
          background,
        })
        await renderTask.promise
      } catch {
        /* cancelled or error — silently ignore */
      } finally {
        if (!cancelled) setIsRendering(false)
      }
    }

    run()
    return () => {
      cancelled = true
      renderTask?.cancel()
    }
  }, [pdf, pageNumber, scale, background])

  return (
    <Box position="relative" display="inline-block">
      {isRendering && (
        <Box
          position="absolute"
          inset={0}
          display="flex"
          alignItems="center"
          justifyContent="center"
          bg="blackAlpha.300"
          zIndex={1}
        >
          <Spinner color="purple.300" size="sm" />
        </Box>
      )}
      <canvas
        ref={canvasRef}
        data-testid={testId}
        style={{
          display: "block",
          maxWidth: "none",
          boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
          borderRadius: "3px",
        }}
      />
      {onPlaceMarker && onSelectMarker && (
        <ScoreMarkerOverlay
          markers={markers}
          isPlacing={isPlacingMarker}
          onPlace={onPlaceMarker}
          onSelectMarker={onSelectMarker}
          highlightedMarkerId={highlightedMarkerId}
        />
      )}
      {markerForm &&
        (() => {
          const pos =
            markerForm.mode === "placing"
              ? { x: markerForm.x, y: markerForm.y }
              : {
                  x: markerForm.marker.rect?.x ?? 0,
                  y: markerForm.marker.rect?.y ?? 0,
                }
          const isEditing = markerForm.mode === "editing"
          return (
            <Box
              position="absolute"
              left={`${pos.x * 100}%`}
              top={`${pos.y * 100}%`}
              transform="translate(-50%, 8px)"
              bg="white"
              color="black"
              borderRadius="6px"
              boxShadow="0 4px 16px rgba(0,0,0,0.35)"
              p={2}
              zIndex={2}
              data-testid="marker-form"
            >
              <HStack spacing={1}>
                <Select
                  autoFocus
                  aria-label="Frame"
                  size="xs"
                  width="110px"
                  value={markerFrameInput}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    onMarkerFrameInputChange?.(e.target.value)
                  }
                  onKeyDown={(e: ReactKeyboardEvent<HTMLSelectElement>) => {
                    if (e.key === "Enter") onConfirmMarker?.()
                    if (e.key === "Escape") onCancelMarker?.()
                  }}
                >
                  {Array.from({ length: indexCount }, (_, frameIndex) => (
                    <option key={frameIndex} value={frameIndex}>
                      Frame {frameIndex}
                    </option>
                  ))}
                </Select>
                <Button
                  size="xs"
                  colorScheme="purple"
                  onClick={onConfirmMarker}
                >
                  {isEditing ? "Save" : "Add"}
                </Button>
                {isEditing && (
                  <Button
                    size="xs"
                    variant="outline"
                    colorScheme="red"
                    onClick={() => onDeleteMarker?.(markerForm.marker._id)}
                  >
                    Delete
                  </Button>
                )}
                <Button size="xs" variant="ghost" onClick={onCancelMarker}>
                  Cancel
                </Button>
              </HStack>
            </Box>
          )
        })()}
    </Box>
  )
}

/* -------------------------------------------------------------------------- */
/*  ThumbnailCanvas — small page preview                                       */
/* -------------------------------------------------------------------------- */

interface ThumbnailCanvasProps {
  pdf: PDFDocumentProxy
  pageNumber: number
  isActive: boolean
  onClick: () => void
}

const ThumbnailCanvas = ({
  pdf,
  pageNumber,
  isActive,
  onClick,
}: ThumbnailCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const activeBorder = useColorModeValue("#805AD5", "#B794F4")
  const inactiveBorder = useColorModeValue("#D6BCFA", "#553C9A")

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const canvas = canvasRef.current
      if (!canvas) return
      try {
        const page = await pdf.getPage(pageNumber)
        if (cancelled) return
        const vp0 = page.getViewport({ scale: 1 })
        const scale = THUMB_WIDTH / vp0.width
        const vp = page.getViewport({ scale })
        const dpr = window.devicePixelRatio || 1
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        canvas.width = Math.floor(vp.width * dpr)
        canvas.height = Math.floor(vp.height * dpr)
        canvas.style.width = `${THUMB_WIDTH}px`
        canvas.style.height = `${Math.floor(vp.height)}px`
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        await page.render({
          canvasContext: ctx,
          viewport: vp,
          background: "#ffffff",
        }).promise
      } catch {
        /* ignore */
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [pdf, pageNumber])

  return (
    <Box
      as="button"
      onClick={onClick}
      display="flex"
      flexDirection="column"
      alignItems="center"
      flexShrink={0}
      border="2px solid"
      borderColor={isActive ? activeBorder : inactiveBorder}
      borderRadius="2px"
      overflow="hidden"
      boxShadow={isActive ? `0 0 0 2px ${activeBorder}55` : undefined}
      bg="white"
      cursor="pointer"
      transition="border-color 0.12s"
      _hover={{ borderColor: activeBorder }}
    >
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </Box>
  )
}

/* -------------------------------------------------------------------------- */
/*  ScorePdfViewer                                                             */
/* -------------------------------------------------------------------------- */

export interface ScorePdfViewerProps {
  presentationId: string
  scores: ScoreDocument[]
  selectedScore: ScoreDocument | null
  previewUrl: string | null
  onSelectScore: (id: string) => void
  onOpenExternal: () => void
  onUpload: () => void
}

const ScorePdfViewer = ({
  presentationId,
  scores,
  selectedScore,
  previewUrl,
  onSelectScore,
  onOpenExternal,
  onUpload,
}: ScorePdfViewerProps) => {
  const dispatch = useAppDispatch()
  const showToast = useCustomToast()
  const indexCount = useAppSelector((state) => state.presentation.indexCount)
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [pageInput, setPageInput] = useState("1")
  const [pageCount, setPageCount] = useState(selectedScore?.pageCount ?? 0)
  const [zoom, setZoom] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [viewerWidth, setViewerWidth] = useState<number>(0)
  const [isPlacingMarker, setIsPlacingMarker] = useState(false)
  const [markerForm, setMarkerForm] = useState<MarkerFormState | null>(null)
  const [markerFrameInput, setMarkerFrameInput] = useState("")
  const [highlightedMarkerId, setHighlightedMarkerId] = useState<string | null>(
    null
  )

  /** Natural width of page 1 at scale=1, used to compute fit-to-width. */
  const naturalPageWidthRef = useRef<number | null>(null)
  const canvasAreaRef = useRef<HTMLDivElement | null>(null)

  /* ── Colors ──────────────────────────────────────────────────────────────── */
  const panelBg = useColorModeValue("#f7f4ee", "#1b1420")
  const toolbarBg = useColorModeValue("white", "#241333")
  const surfaceBg = useColorModeValue("#ede8de", "#0f0a14")
  const borderColor = useColorModeValue("purple.200", "whiteAlpha.300")
  const borderRaw = useColorModeValue("#D6BCFA", "#3a2447")
  const mutedText = useColorModeValue("gray.500", "whiteAlpha.600")
  const thumbLabel = useColorModeValue("gray.400", "whiteAlpha.400")
  const expandOverlay = useColorModeValue("blackAlpha.600", "blackAlpha.800")
  const emptyText = useColorModeValue("gray.700", "whiteAlpha.800")

  const url =
    previewUrl ?? (selectedScore ? (getScoreUrl(selectedScore) ?? null) : null)
  const showThumbs = viewerWidth >= THUMB_HIDE_THRESHOLD
  const mainColWidth = showThumbs ? viewerWidth - THUMB_COL_WIDTH : viewerWidth

  /** The zoom to actually render — never blocks display even before ResizeObserver fires. */
  const effectiveZoom = zoom ?? FALLBACK_ZOOM

  /* ── ResizeObserver: track canvas area width ────────────────────────────── */
  useEffect(() => {
    const el = canvasAreaRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0
      setViewerWidth(w)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  /* ── Recompute fit-to-width when container changes ──────────────────────── */
  useEffect(() => {
    const pw = naturalPageWidthRef.current
    if (pw && mainColWidth > 40) {
      setZoom(Number(clamp((mainColWidth - 32) / pw, 0.3, 3.0).toFixed(2)))
    }
  }, [mainColWidth])

  /* ── Reset state when score changes ────────────────────────────────────── */
  useEffect(() => {
    setPageNumber(1)
    setPageInput("1")
    setPageCount(selectedScore?.pageCount ?? 0)
    naturalPageWidthRef.current = null
    setZoom(null)
  }, [selectedScore?._id, selectedScore?.pageCount])

  /* ── Load PDF ───────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!url) {
      setPdf(null)
      setLoadError(null)
      return
    }

    let cancelled = false
    let loadingTask: PDFDocumentLoadingTask | null = null

    setIsLoading(true)
    setLoadError(null)

    const load = async () => {
      try {
        const { GlobalWorkerOptions, getDocument } = await import("pdfjs-dist")
        if (cancelled) return
        GlobalWorkerOptions.workerSrc = workerUrl
        const token = getToken()
        loadingTask = getDocument({
          url,
          httpHeaders:
            url.startsWith("/api/") && token
              ? { Authorization: `bearer ${token}` }
              : undefined,
          disableRange: true,
          disableStream: true,
        })
        const doc = await loadingTask.promise
        if (cancelled) {
          await doc.destroy()
          return
        }

        setPdf(doc)
        setPageCount(doc.numPages)

        /* Measure natural page width → fit-to-width */
        const page = await doc.getPage(1)
        if (cancelled) return
        const vp0 = page.getViewport({ scale: 1 })
        naturalPageWidthRef.current = vp0.width

        const col = mainColWidth > 40 ? mainColWidth : 0
        if (col > 0) {
          setZoom(Number(clamp((col - 32) / vp0.width, 0.3, 3.0).toFixed(2)))
        }
      } catch {
        if (!cancelled) {
          setPdf(null)
          setLoadError("PDF preview unavailable.")
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
      void loadingTask?.destroy()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url])

  /* ── Thumbnail list ─────────────────────────────────────────────────────── */
  const thumbnailPages = useMemo(
    () =>
      pageCount
        ? Array.from({ length: Math.min(pageCount, 40) }, (_, i) => i + 1)
        : [],
    [pageCount]
  )

  /* ── Navigation / zoom helpers ──────────────────────────────────────────── */
  const goToPage = useCallback(
    (n: number) => {
      const p = clamp(n, 1, Math.max(pageCount, 1))
      setPageNumber(p)
      setPageInput(String(p))
    },
    [pageCount]
  )

  const commitPageInput = () => goToPage(Number(pageInput) || 1)

  const changeZoom = (delta: number) =>
    setZoom((z) =>
      Number(clamp((z ?? FALLBACK_ZOOM) + delta, 0.3, 3.0).toFixed(2))
    )

  const fitToWidth = useCallback(() => {
    const pw = naturalPageWidthRef.current
    if (pw && mainColWidth > 40)
      setZoom(Number(clamp((mainColWidth - 32) / pw, 0.3, 3.0).toFixed(2)))
  }, [mainColWidth])

  /* ── Frame markers ────────────────────────────────────────────────────── */
  const currentPageMarkers = useMemo(
    () => (selectedScore?.markers ?? []).filter((m) => m.page === pageNumber),
    [selectedScore, pageNumber]
  )

  const allMarkers = useMemo(
    () =>
      [...(selectedScore?.markers ?? [])].sort(
        (a, b) => a.page - b.page || a.frameIndex - b.frameIndex
      ),
    [selectedScore]
  )

  // Clears the ping a few seconds after a "jump to marker" click.
  useEffect(() => {
    if (!highlightedMarkerId) return
    const timer = setTimeout(() => setHighlightedMarkerId(null), 3000)
    return () => clearTimeout(timer)
  }, [highlightedMarkerId])

  // Scrolls the target marker into view (needed even on same-page jumps).
  useEffect(() => {
    if (!highlightedMarkerId) return
    const timer = setTimeout(() => {
      const el = canvasAreaRef.current?.querySelector<HTMLElement>(
        `[data-marker-id="${highlightedMarkerId}"]`
      )
      el?.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      })
    }, 150)
    return () => clearTimeout(timer)
  }, [highlightedMarkerId, pageNumber])

  const handleGoToMarker = (marker: ScoreMarker) => {
    goToPage(marker.page)
    setHighlightedMarkerId(marker._id)
  }

  const handlePlaceMarker = (x: number, y: number) => {
    setMarkerForm({ mode: "placing", x, y })
    setMarkerFrameInput("0")
  }

  const handleSelectMarker = (marker: ScoreMarker) => {
    setMarkerForm({ mode: "editing", marker })
    setMarkerFrameInput(String(marker.frameIndex))
    setHighlightedMarkerId(null)
  }

  const handleCancelMarker = () => {
    setMarkerForm(null)
    setMarkerFrameInput("")
  }

  const handleConfirmMarker = async () => {
    if (!markerForm || !selectedScore) return
    const frameIndex = Number(markerFrameInput)
    if (
      !Number.isInteger(frameIndex) ||
      frameIndex < 0 ||
      frameIndex >= indexCount
    ) {
      showToast({
        title: "Invalid frame number",
        description: `Enter a whole number between 0 and ${indexCount - 1}.`,
        status: "warning",
      })
      return
    }

    try {
      if (markerForm.mode === "placing") {
        await dispatch(
          createScoreMarker(presentationId, selectedScore._id, {
            page: pageNumber,
            frameIndex,
            rect: { x: markerForm.x, y: markerForm.y, width: 0, height: 0 },
          })
        )
      } else {
        await dispatch(
          updateScoreMarker(
            presentationId,
            selectedScore._id,
            markerForm.marker._id,
            {
              page: markerForm.marker.page,
              frameIndex,
              rect: markerForm.marker.rect,
            }
          )
        )
      }
      setMarkerForm(null)
      setMarkerFrameInput("")
    } catch (error) {
      showToast({
        title: "Couldn't save marker",
        description: error instanceof Error ? error.message : undefined,
        status: "error",
      })
    }
  }

  const handleDeleteMarker = async (markerId: string) => {
    if (!selectedScore) return
    try {
      await dispatch(
        deleteScoreMarker(presentationId, selectedScore._id, markerId)
      )
      setMarkerForm(null)
      setMarkerFrameInput("")
    } catch (error) {
      showToast({
        title: "Couldn't remove marker",
        description: error instanceof Error ? error.message : undefined,
        status: "error",
      })
    }
  }

  /* ======================================================================== */
  /*  Viewer JSX — shared between normal and expanded modes                   */
  /* ======================================================================== */
  const viewerContent = (
    <Box
      border="1px solid"
      borderColor={borderColor}
      borderRadius="8px"
      bg={panelBg}
      overflow="hidden"
      flex="1"
      minH={0}
      display="flex"
      flexDirection="column"
    >
      {/* ── Single-row compact toolbar ────────────────────────────────── */}
      <HStack
        px={2}
        py="4px"
        bg={toolbarBg}
        borderBottom="1px solid"
        borderColor={borderColor}
        flex="0 0 auto"
        gap={1}
        flexWrap="nowrap"
        minW={0}
        overflow="hidden"
      >
        {/* Partition dropdown */}
        <Menu>
          <MenuButton
            as={Button}
            variant="ghost"
            size="xs"
            px={1}
            minW={0}
            maxW="150px"
            flex="1 1 0"
            textAlign="left"
            rightIcon={<ChevronDownIcon />}
          >
            <Text
              fontWeight={600}
              fontSize="11px"
              noOfLines={1}
              textAlign="left"
            >
              {selectedScore?.title ?? "Select…"}
            </Text>
          </MenuButton>
          <MenuList zIndex={2000} maxH="240px" overflowY="auto" fontSize="12px">
            {scores.map((s) => (
              <MenuItem
                key={s._id}
                fontWeight={s._id === selectedScore?._id ? 700 : 400}
                fontSize="12px"
                onClick={() => onSelectScore(s._id)}
              >
                {s.title}
              </MenuItem>
            ))}
          </MenuList>
        </Menu>

        {/* Page nav */}
        <HStack spacing={0} flexShrink={0}>
          <IconButton
            aria-label="Previous page"
            icon={<ChevronLeftIcon />}
            size="xs"
            variant="ghost"
            isDisabled={!pdf || pageNumber <= 1}
            onClick={() => goToPage(pageNumber - 1)}
          />
          <Input
            aria-label="Page"
            value={pageInput}
            size="xs"
            width="30px"
            textAlign="center"
            isDisabled={!pdf}
            border="1px solid"
            borderColor={borderRaw}
            borderRadius="3px"
            px={0}
            onChange={(e) => setPageInput(e.target.value)}
            onBlur={commitPageInput}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitPageInput()
            }}
          />
          <IconButton
            aria-label="Next page"
            icon={<ChevronRightIcon />}
            size="xs"
            variant="ghost"
            isDisabled={!pdf || pageNumber >= pageCount}
            onClick={() => goToPage(pageNumber + 1)}
          />
        </HStack>

        {pageCount > 0 && (
          <Text fontSize="10px" color={mutedText} flexShrink={0} mr={1}>
            /{pageCount}
          </Text>
        )}

        {/* Zoom: − [95%] + */}
        <HStack spacing={0} flexShrink={0}>
          <Box
            as="button"
            h="20px"
            w="20px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            border="1px solid"
            borderColor={borderRaw}
            borderRightWidth={0}
            borderRadius="3px 0 0 3px"
            fontSize="13px"
            opacity={!pdf || effectiveZoom <= 0.3 ? 0.4 : 1}
            cursor={!pdf || effectiveZoom <= 0.3 ? "not-allowed" : "pointer"}
            onClick={() => {
              if (pdf && effectiveZoom > 0.3) changeZoom(-0.1)
            }}
            _hover={{ bg: "whiteAlpha.200" }}
            userSelect="none"
          >
            −
          </Box>
          <Box
            h="20px"
            px="4px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            border="1px solid"
            borderColor={borderRaw}
            fontSize="10px"
            minW="36px"
            cursor={pdf ? "pointer" : "default"}
            title="Click to fit to width"
            onClick={fitToWidth}
            _hover={pdf ? { bg: "whiteAlpha.200" } : {}}
            userSelect="none"
          >
            {zoom !== null ? `${Math.round(zoom * 100)}%` : "fit"}
          </Box>
          <Box
            as="button"
            h="20px"
            w="20px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            border="1px solid"
            borderColor={borderRaw}
            borderLeftWidth={0}
            borderRadius="0 3px 3px 0"
            fontSize="13px"
            opacity={!pdf || effectiveZoom >= 3.0 ? 0.4 : 1}
            cursor={!pdf || effectiveZoom >= 3.0 ? "not-allowed" : "pointer"}
            onClick={() => {
              if (pdf && effectiveZoom < 3.0) changeZoom(0.1)
            }}
            _hover={{ bg: "whiteAlpha.200" }}
            userSelect="none"
          >
            +
          </Box>
        </HStack>

        <Button
          aria-label={isPlacingMarker ? "Stop adding markers" : "Add marker"}
          leftIcon={
            <Text fontSize="12px" lineHeight={1}>
              📍
            </Text>
          }
          size="xs"
          variant={isPlacingMarker ? "solid" : "outline"}
          colorScheme="purple"
          flexShrink={0}
          isDisabled={!pdf || !selectedScore}
          title={
            isPlacingMarker
              ? "Click the score to place a marker; click here again to stop"
              : "Add a marker to the score"
          }
          onClick={() => {
            handleCancelMarker()
            setIsPlacingMarker((prev) => !prev)
          }}
        >
          {isPlacingMarker ? "Placing…" : "Marker"}
        </Button>

        {/* Expand */}
        <IconButton
          aria-label={isExpanded ? "Close expanded viewer" : "Expand viewer"}
          icon={
            <Text fontSize="12px" lineHeight={1}>
              {isExpanded ? "✕" : "⤢"}
            </Text>
          }
          size="xs"
          variant="ghost"
          flexShrink={0}
          onClick={() => setIsExpanded((e) => !e)}
        />

        {/* Open externally */}
        <IconButton
          aria-label="Open PDF externally"
          icon={<ExternalLinkIcon />}
          size="xs"
          variant="ghost"
          flexShrink={0}
          isDisabled={!url}
          onClick={onOpenExternal}
        />
      </HStack>

      {/* ── Body: thumbnails + main canvas ───────────────────────────── */}
      <HStack align="stretch" spacing={0} flex="1" minH={0} ref={canvasAreaRef}>
        {/* Thumbnail column — hidden when panel too narrow */}
        {showThumbs && (
          <VStack
            align="center"
            spacing="5px"
            width={`${THUMB_COL_WIDTH}px`}
            flex={`0 0 ${THUMB_COL_WIDTH}px`}
            bg={toolbarBg}
            borderRight="1px solid"
            borderColor={borderColor}
            py="8px"
            px="6px"
            overflowY="auto"
            overflowX="hidden"
          >
            <Text
              fontSize="8px"
              letterSpacing="0.08em"
              textTransform="uppercase"
              color={thumbLabel}
              mb={1}
            >
              Pages
            </Text>
            {pdf
              ? thumbnailPages.map((page) => (
                  <ThumbnailCanvas
                    key={page}
                    pdf={pdf}
                    pageNumber={page}
                    isActive={page === pageNumber}
                    onClick={() => goToPage(page)}
                  />
                ))
              : thumbnailPages.map((page) => (
                  <Box
                    key={page}
                    as="button"
                    h="70px"
                    w={`${THUMB_WIDTH}px`}
                    bg={surfaceBg}
                    borderRadius="2px"
                    border="1px solid"
                    borderColor={
                      page === pageNumber ? "purple.400" : borderColor
                    }
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontSize="10px"
                    color={mutedText}
                    cursor="pointer"
                    onClick={() => goToPage(page)}
                  >
                    {page}
                  </Box>
                ))}
            {pageCount > 0 && (
              <Text fontSize="9px" color={thumbLabel} mt={1}>
                {pageNumber}/{pageCount}
              </Text>
            )}
          </VStack>
        )}

        {/* Main PDF canvas area */}
        <Box
          flex="1"
          minW={0}
          minH={0}
          bg={surfaceBg}
          overflowX="hidden"
          overflowY="auto"
          p={4}
          display="flex"
          alignItems="flex-start"
          justifyContent="center"
        >
          {isLoading ? (
            <VStack mt={8}>
              <Spinner color="purple.300" />
              <Text fontSize="12px" color={mutedText}>
                Loading PDF…
              </Text>
            </VStack>
          ) : pdf ? (
            /* pdf is loaded — effectiveZoom is always ≥ FALLBACK_ZOOM, never blocks */
            <PdfCanvas
              pdf={pdf}
              pageNumber={pageNumber}
              scale={effectiveZoom}
              background="#ffffff"
              testId="score-pdf-viewer"
              markers={currentPageMarkers}
              isPlacingMarker={isPlacingMarker}
              onPlaceMarker={handlePlaceMarker}
              onSelectMarker={handleSelectMarker}
              onDeleteMarker={handleDeleteMarker}
              markerForm={markerForm}
              markerFrameInput={markerFrameInput}
              indexCount={indexCount}
              onMarkerFrameInputChange={setMarkerFrameInput}
              onConfirmMarker={handleConfirmMarker}
              onCancelMarker={handleCancelMarker}
              highlightedMarkerId={highlightedMarkerId}
            />
          ) : loadError ? (
            <VStack mt={8} spacing={3}>
              <Text fontSize="12px" color={mutedText}>
                {loadError}
              </Text>
              <Button
                leftIcon={<ExternalLinkIcon />}
                colorScheme="purple"
                variant="outline"
                size="sm"
                onClick={onOpenExternal}
              >
                Open PDF
              </Button>
            </VStack>
          ) : (
            <Text mt={8} fontSize="12px" color={mutedText}>
              Select a score to preview it.
            </Text>
          )}
        </Box>
      </HStack>

      {/* ── Marker recap — where every marker sits across the score's pages ── */}
      {allMarkers.length > 0 && (
        <HStack
          px={2}
          py="4px"
          bg={toolbarBg}
          borderTop="1px solid"
          borderColor={borderColor}
          flex="0 0 auto"
          spacing={1}
          overflowX="auto"
          flexWrap="nowrap"
        >
          <Text
            fontSize="10px"
            fontWeight={700}
            color={mutedText}
            flexShrink={0}
            mr={1}
          >
            Markers:
          </Text>
          {allMarkers.map((marker, i) => (
            <Button
              key={marker._id}
              size="xs"
              variant={marker.page === pageNumber ? "solid" : "outline"}
              colorScheme="purple"
              flexShrink={0}
              title={`Marker ${i + 1} — Page ${marker.page}, Frame ${marker.frameIndex}`}
              onClick={() => handleGoToMarker(marker)}
            >
              {`${i + 1} · P${marker.page}`}
            </Button>
          ))}
        </HStack>
      )}
    </Box>
  )

  /* ── Empty state ─────────────────────────────────────────────────────────── */
  if (scores.length === 0) {
    return (
      <Box
        flex="1"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        gap={3}
        border="1px dashed"
        borderColor={borderColor}
        borderRadius="10px"
        bg={panelBg}
        p={6}
        cursor="pointer"
        transition="border-color 0.15s"
        _hover={{ borderColor: "purple.400" }}
        onClick={onUpload}
      >
        <Text fontSize="14px" fontWeight={600} color={emptyText}>
          Glissez un PDF ici
        </Text>
        <Text fontSize="12px" color={mutedText}>
          ou{" "}
          <Box as="span" color="purple.400" fontWeight={600}>
            parcourir
          </Box>{" "}
          · .pdf
        </Text>
      </Box>
    )
  }

  /* ── Expand overlay ──────────────────────────────────────────────────────── */
  if (isExpanded) {
    return (
      <>
        <Box
          position="fixed"
          inset={0}
          bg={expandOverlay}
          zIndex={1390}
          onClick={() => setIsExpanded(false)}
        />
        <Box
          position="fixed"
          inset="12px"
          zIndex={1400}
          display="flex"
          flexDirection="column"
          borderRadius="10px"
          overflow="hidden"
          boxShadow="0 24px 70px rgba(0,0,0,0.6)"
        >
          {viewerContent}
        </Box>
      </>
    )
  }

  return viewerContent
}

export default ScorePdfViewer
