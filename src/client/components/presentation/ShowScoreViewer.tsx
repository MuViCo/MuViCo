import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url"
import {
  Box,
  Button,
  HStack,
  IconButton,
  Spinner,
  Text,
} from "@chakra-ui/react"
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons"
import { useEffect, useMemo, useRef, useState } from "react"
import getToken from "../../auth"
import type {
  PDFDocumentLoadingTask,
  PDFDocumentProxy,
  RenderTask,
} from "pdfjs-dist/types/src/pdf"
import type { ScoreDocument, ScoreMarker } from "../../types"
import { ScoreMarkerPin } from "./ScoreMarkerOverlay"

type PageMode = "two" | "scroll"

interface ShowScoreViewerProps {
  score: ScoreDocument | null
  cueIndex: number
  pageMode: PageMode
  autoPageTurn: boolean
  compact?: boolean
  onPageModeChange?: (mode: PageMode) => void
  onAutoPageTurnChange?: (active: boolean) => void
}

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value))

const markerForFrame = (markers: ScoreMarker[], cueIndex: number) => {
  const ordered = [...markers].sort(
    (first, second) => first.frameIndex - second.frameIndex
  )
  return (
    ordered.filter((marker) => marker.frameIndex <= cueIndex).at(-1) ??
    ordered[0] ??
    null
  )
}

const ShowPdfPage = ({
  pdf,
  pageNumber,
  markers,
  activeMarker,
  pageWidth,
  onLoad,
}: {
  pdf: PDFDocumentProxy
  pageNumber: number
  markers: ScoreMarker[]
  activeMarker: ScoreMarker | null
  pageWidth?: number
  onLoad?: (baseWidth: number, aspectRatio: number) => void
}) => {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const onLoadRef = useRef(onLoad)
  useEffect(() => {
    onLoadRef.current = onLoad
  }, [onLoad])

  useEffect(() => {
    const host = hostRef.current
    const canvas = canvasRef.current
    if (!host || !canvas) return
    let task: RenderTask | null = null
    let cancelled = false
    let isRendering = false
    let queuedWidth: number | null = null
    let renderedWidth = 0

    const render = async (width: number) => {
      const page = await pdf.getPage(pageNumber)
      if (cancelled) return
      const base = page.getViewport({ scale: 1 })
      onLoadRef.current?.(base.width, base.width / base.height)
      const viewport = page.getViewport({ scale: width / base.width })
      const dpr = window.devicePixelRatio || 1
      const buffer = document.createElement("canvas")
      buffer.width = Math.floor(viewport.width * dpr)
      buffer.height = Math.floor(viewport.height * dpr)
      const context = buffer.getContext("2d")
      if (!context) return

      const transform = dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined

      task = page.render({
        canvasContext: context,
        viewport,
        transform,
        background: "#f7f4ee",
      })
      await task.promise
      if (cancelled) return
      const visibleContext = canvas.getContext("2d")
      if (!visibleContext) return
      canvas.width = buffer.width
      canvas.height = buffer.height
      canvas.style.width = `${viewport.width}px`
      canvas.style.height = `${viewport.height}px`
      visibleContext.drawImage(buffer, 0, 0)
      renderedWidth = width
    }

    const flushRender = async () => {
      if (isRendering || cancelled) return
      isRendering = true
      while (!cancelled && queuedWidth !== null) {
        const width = queuedWidth
        queuedWidth = null
        if (Math.abs(width - renderedWidth) < 1) continue
        try {
          await render(width)
        } catch {
          if (cancelled) return
        }
      }
      isRendering = false
    }

    const queueRender = () => {
      queuedWidth = Math.max(260, Math.round(host.clientWidth))
      void flushRender()
    }

    const observer = new ResizeObserver(queueRender)
    observer.observe(host)
    queueRender()
    return () => {
      cancelled = true
      queuedWidth = null
      observer.disconnect()
      task?.cancel()
    }
  }, [pageNumber, pdf])

  const containerStyle = pageWidth
    ? {
        width: `${pageWidth}px`,
        flex: "0 0 auto",
        maxWidth: "none",
        minWidth: 0,
      }
    : undefined

  return (
    <Box
      ref={hostRef}
      className="show-score-page"
      data-page={pageNumber}
      style={containerStyle}
    >
      <canvas ref={canvasRef} />
      {markers
        .filter((marker) => marker.page === pageNumber && marker.rect)
        .map((marker) => (
          <ScoreMarkerPin
            key={marker._id}
            marker={marker}
            isActive={marker._id === activeMarker?._id}
          />
        ))}
      <Text className="show-score-page-number">p. {pageNumber}</Text>
    </Box>
  )
}

const ShowScoreViewer = ({
  score,
  cueIndex,
  pageMode,
  autoPageTurn,
  compact = false,
  onPageModeChange,
  onAutoPageTurnChange,
}: ShowScoreViewerProps) => {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [manualPage, setManualPage] = useState(1)
  const [zoom, setZoom] = useState(0) // 0 means Fit, > 0 is absolute scale
  const [aspectRatio, setAspectRatio] = useState<number | null>(null)
  const [baseWidth, setBaseWidth] = useState<number | null>(null)
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 })
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const url = score?.file?.proxyUrl ?? score?.file?.url ?? score?.sourceUrl
  const activeMarker = useMemo(
    () => markerForFrame(score?.markers ?? [], cueIndex),
    [cueIndex, score?.markers]
  )
  const activePage = clamp(
    autoPageTurn ? (activeMarker?.page ?? manualPage) : manualPage,
    1,
    Math.max(pdf?.numPages ?? score?.pageCount ?? 1, 1)
  )

  useEffect(() => {
    if (!url) {
      setPdf(null)
      setAspectRatio(null)
      setBaseWidth(null)
      return
    }
    let loadingTask: PDFDocumentLoadingTask | null = null
    let cancelled = false
    setIsLoading(true)
    setLoadError(false)

    const load = async () => {
      try {
        const { GlobalWorkerOptions, getDocument } = await import("pdfjs-dist")
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
        const document = await loadingTask.promise
        if (cancelled) return
        setPdf(document)
      } catch {
        if (!cancelled) setLoadError(true)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
      void loadingTask?.destroy()
    }
  }, [url])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      if (entries[0]) {
        setContainerSize({
          w: entries[0].contentRect.width,
          h: entries[0].contentRect.height,
        })
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  let pageWidth: number | undefined
  let fitW = 0
  if (containerSize.w > 0 && containerSize.h > 0 && aspectRatio) {
    const gap = 12
    const padding = 16 // safe margin vertically
    const availableW =
      pageMode === "two"
        ? (containerSize.w - gap) / 2
        : Math.min(containerSize.w, 980)
    const availableH = containerSize.h - padding
    fitW = Math.min(availableW, availableH * aspectRatio)
    pageWidth = zoom === 0 ? fitW : (baseWidth ?? fitW) * zoom
  }

  const currentScale =
    zoom === 0 ? (baseWidth && fitW ? fitW / baseWidth : 1) : zoom

  useEffect(() => {
    if (!autoPageTurn) return
    setManualPage(activeMarker?.page ?? 1)
  }, [activeMarker?.page, autoPageTurn])

  useEffect(() => {
    if (pageMode !== "scroll") return
    scrollRef.current
      ?.querySelector<HTMLElement>(`[data-page="${activePage}"]`)
      ?.scrollIntoView({ block: "start", behavior: "smooth" })
  }, [activePage, pageMode])

  if (!score) {
    return (
      <Box className="show-score-empty">
        <Text fontWeight={700}>No score selected</Text>
        <Text>Import a PDF from the editor to use Music stand.</Text>
      </Box>
    )
  }

  return (
    <Box className={`show-score ${compact ? "show-score-compact" : ""}`}>
      <Box className="show-score-toolbar">
        <Box minW={0}>
          <Text className="show-score-measure">
            {activeMarker?.measureLabel || `Frame ${cueIndex}`}
          </Text>
          <Text className="show-score-title" title={score.title}>
            {score.title}
          </Text>
        </Box>
        {!compact && (
          <HStack spacing={2} ml="auto">
            <Box className="show-segmented">
              <Button
                aria-label="Zoom out"
                onClick={() =>
                  setZoom(Math.max(0.25, Math.ceil(currentScale * 4 - 1.1) / 4))
                }
              >
                -
              </Button>
              <Button onClick={() => setZoom(zoom === 0 ? 1 : 0)} w="52px">
                {zoom === 0 ? "Fit" : `${Math.round(zoom * 100)}%`}
              </Button>
              <Button
                aria-label="Zoom in"
                onClick={() =>
                  setZoom(Math.min(3, Math.floor(currentScale * 4 + 1.1) / 4))
                }
              >
                +
              </Button>
            </Box>
            <Box className="show-segmented">
              <Button
                data-active={pageMode === "two"}
                onClick={() => onPageModeChange?.("two")}
              >
                Two pages
              </Button>
              <Button
                data-active={pageMode === "scroll"}
                onClick={() => onPageModeChange?.("scroll")}
              >
                Scrolling
              </Button>
            </Box>
            <Button
              className="show-auto-turn"
              data-active={autoPageTurn}
              onClick={() => onAutoPageTurnChange?.(!autoPageTurn)}
            >
              <Box className="show-toggle-track">
                <Box />
              </Box>
              Auto page turn
            </Button>
          </HStack>
        )}
      </Box>
      <Box
        ref={scrollRef}
        className={`show-score-pages show-score-pages-${pageMode}`}
        style={{
          justifyContent:
            (!pageWidth ||
              pageWidth < containerSize.w / (pageMode === "two" ? 2 : 1)) &&
            pageMode === "two"
              ? "center"
              : "flex-start",
          alignItems:
            pageWidth && pageWidth > containerSize.w && pageMode === "scroll"
              ? "flex-start"
              : undefined,
        }}
      >
        {isLoading && <Spinner color="muvico.accent" />}
        {loadError && <Text>PDF preview unavailable.</Text>}
        {pdf && pageMode === "two" && (
          <>
            <ShowPdfPage
              pdf={pdf}
              pageNumber={activePage}
              markers={score.markers}
              activeMarker={activeMarker}
              pageWidth={pageWidth}
              onLoad={(w, ratio) => {
                setBaseWidth((prev) => prev ?? w)
                setAspectRatio((prev) => prev ?? ratio)
              }}
            />
            {activePage < pdf.numPages && (
              <ShowPdfPage
                pdf={pdf}
                pageNumber={activePage + 1}
                markers={score.markers}
                activeMarker={activeMarker}
                pageWidth={pageWidth}
              />
            )}
          </>
        )}
        {pdf &&
          pageMode === "scroll" &&
          Array.from({ length: pdf.numPages }, (_, index) => index + 1).map(
            (pageNumber) => (
              <ShowPdfPage
                key={pageNumber}
                pdf={pdf}
                pageNumber={pageNumber}
                markers={score.markers}
                activeMarker={activeMarker}
                pageWidth={pageWidth}
              />
            )
          )}
      </Box>
      {!compact && pdf && (
        <HStack className="show-score-pagination">
          <IconButton
            aria-label="Previous score page"
            icon={<ChevronLeftIcon />}
            isDisabled={activePage <= 1}
            onClick={() => {
              setManualPage(activePage - 1)
              onAutoPageTurnChange?.(false)
            }}
          />
          <Text>
            {activePage} / {pdf.numPages}
          </Text>
          <IconButton
            aria-label="Next score page"
            icon={<ChevronRightIcon />}
            isDisabled={activePage >= pdf.numPages}
            onClick={() => {
              setManualPage(activePage + 1)
              onAutoPageTurnChange?.(false)
            }}
          />
        </HStack>
      )}
    </Box>
  )
}

export default ShowScoreViewer
