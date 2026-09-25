/**
 * screens display component for presentation mode, showing the content of each screen based on the cues and their timing
 * - Displays the content for each screen based on the cues and their timing
 * - Supports images, videos, and colored backgrounds as screen content
 * - Shows "No content" message if there are no cues for a screen at the current cue index
 * - Includes buttons to open/close each screen in edit mode
 * - Uses useMemo to optimize performance by memoizing the cue visual span map and cues sorted by screen
 * - Determines the current cue for each screen based on the cue index and the visual span of each cue
 */

import { Button, Select } from "@chakra-ui/react"
import { useEffect, useMemo, useRef, useState } from "react"
import type { SyntheticEvent } from "react"
import { usePrefersReducedMotion } from "@chakra-ui/react"
import {
  buildCueVisualSpanMap,
  getCueVisualSpanFromMap,
} from "../utils/cueVisualSpanUtils"
import { isImageFile, isVideoFile } from "../utils/fileTypeUtils"
import { normalizeCueOpacity } from "../utils/cueOpacityUtils"
import { cueFrameStyle } from "../utils/cueFrame"
import ScreenLayerFrame from "./ScreenLayerFrame"

import type { CueFrame } from "../utils/cueFrame"
import {
  computeScreenSpanLayout,
  screenWidthMapFromRatios,
} from "../utils/screenSpanLayout"
import {
  OUTPUT_ASPECT_RATIO_OPTIONS,
  parseAspectRatio,
  resolveScreenAspectRatio,
} from "../../../constants.js"
import CueText from "../utils/CueText"
import { isTextCue } from "../utils/cueText"

import type { Cue, CueFileMeta } from "../../types"

const SpannedTilePreview = ({
  imageSrc,
  name,
  spanScreens,
  screenNumber,
  screenAspectRatios,
  outputAspectRatio,
}: {
  imageSrc: string
  name: string
  spanScreens: number[]
  screenNumber: number
  screenAspectRatios?: Record<string, string>
  outputAspectRatio?: string
}) => {
  const [aspectRatio, setAspectRatio] = useState<number | null>(null)

  const handleProbeLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = event.currentTarget
    if (naturalWidth > 0 && naturalHeight > 0) {
      setAspectRatio(naturalWidth / naturalHeight)
    }
  }

  if (!aspectRatio) {
    return (
      <>
        <img
          src={imageSrc}
          alt={name}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
        <img
          src={imageSrc}
          alt=""
          onLoad={handleProbeLoad}
          style={{ display: "none" }}
        />
      </>
    )
  }

  const widthMap = screenWidthMapFromRatios(
    spanScreens,
    screenAspectRatios,
    outputAspectRatio
  )
  const { canvasWidth, canvasHeight, offsets } = computeScreenSpanLayout(
    spanScreens,
    widthMap,
    aspectRatio
  )
  const tileWidth = widthMap[screenNumber]
  const tileHeight = 1

  const backgroundPositionXPercent =
    canvasWidth > tileWidth
      ? (offsets[screenNumber] / (canvasWidth - tileWidth)) * 100
      : 0

  return (
    <div
      role="img"
      aria-label={name}
      style={{
        width: "100%",
        height: "100%",
        backgroundImage: `url(${imageSrc})`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: `${backgroundPositionXPercent}% 50%`,
        backgroundSize: `${(canvasWidth / tileWidth) * 100}% ${(canvasHeight / tileHeight) * 100}%`,
      }}
    />
  )
}

export interface ScreensDisplayProps {
  screenCount?: number
  cues?: Cue[]
  cueIndex?: number
  indexCount?: number
  editModeBackground?: string
  /** Keyed by screen number as a string, since it is built from Object.keys. */
  screens?: Record<string, boolean>
  toggleScreenVisibility?: (screenNumber: number) => void
  /** Screen whose lane currently has focus in the timeline, or null. */
  focusedScreen?: number | null
  outputAspectRatio?: string
  screenAspectRatios?: Record<string, string>
  onScreenAspectRatioChange?: (screenNumber: number, ratio: string) => void
  onSetCueFrame?: (cue: Cue, frame: CueFrame) => void
}

const sortByLayerPriority = (cues: Cue[]): Cue[] =>
  [...cues].sort(
    (firstCue, secondCue) =>
      Number(secondCue.layer ?? 0) - Number(firstCue.layer ?? 0)
  )

// Screens display component
export const ScreensDisplay = ({
  screenCount = 3,
  cues = [],
  cueIndex = 0,
  indexCount = 0,
  editModeBackground,
  screens = {},
  toggleScreenVisibility = () => {},
  focusedScreen = null,
  outputAspectRatio,
  screenAspectRatios,
  onScreenAspectRatioChange,
  onSetCueFrame,
}: ScreensDisplayProps) => {
  const tileAspectRatioFor = (screenNumber: number) =>
    parseAspectRatio(
      resolveScreenAspectRatio(
        screenAspectRatios,
        screenNumber,
        outputAspectRatio
      )
    )
  const stripRef = useRef<HTMLDivElement | null>(null)
  const tileRefs = useRef<Record<number, HTMLDivElement | null>>({})
  const lastScrolledRef = useRef<number | null>(null)
  const prefersReducedMotion = usePrefersReducedMotion()

  /**
   * Bring the focused screen's tile into view.
   *
   * scrollTo on the strip, deliberately not tile.scrollIntoView: that walks
   * every scrollable ancestor, and the editor shell and its container are
   * overflow:hidden -- still programmatically scrollable, so scrollIntoView
   * would offset the whole shell with no scrollbar to put it back.
   *
   * Keyed on focusedScreen alone, with a guard against re-entry, so the strip
   * moves on a focus change and never on an unrelated re-render.
   */
  useEffect(() => {
    if (focusedScreen == null) {
      lastScrolledRef.current = null
      return
    }
    if (lastScrolledRef.current === focusedScreen) return
    lastScrolledRef.current = focusedScreen

    const strip = stripRef.current
    const tile = tileRefs.current[focusedScreen]
    if (!strip || !tile || typeof strip.scrollTo !== "function") return

    // Visibility is tested against the tile's real edges; the padding is
    // breathing room applied to the scroll target only. Folding it into the
    // comparison would make a tile flush with the left edge read as off-screen
    // and trigger a pointless scroll.
    const padding = 12
    const start = tile.offsetLeft
    const end = start + tile.offsetWidth
    const viewStart = strip.scrollLeft
    const viewEnd = viewStart + strip.clientWidth

    // Already fully visible: leave the user's scroll position alone.
    let next: number | null = null
    if (start < viewStart) next = start - padding
    else if (end > viewEnd) next = end - strip.clientWidth + padding
    if (next === null) return

    strip.scrollTo({
      left: Math.max(0, next),
      behavior: prefersReducedMotion ? "auto" : "smooth",
    })
  }, [focusedScreen, prefersReducedMotion])
  const cueVisualSpanMap = useMemo(
    () => buildCueVisualSpanMap(cues, indexCount),
    [cues, indexCount]
  )
  const screenSortedCuesByScreen = useMemo(() => {
    return (cues || []).reduce<Record<number, Cue[]>>((acc, cue) => {
      // A spanning cue must show up in the preview of every screen it
      // spans, not just its primary screen -- otherwise a screen with no
      // cue of its own looks empty even though it's covered by the span.
      const screenNumbers = cue.spanScreens?.length
        ? cue.spanScreens
        : [Number(cue.screen)]
      screenNumbers.forEach((screenNumber) => {
        if (!acc[screenNumber]) {
          acc[screenNumber] = []
        }
        acc[screenNumber].push(cue)
      })
      return acc
    }, {})
  }, [cues])

  const getCurrentCueStackForScreen = (screenNumber: number): Cue[] => {
    const cuesOnScreen = screenSortedCuesByScreen[Number(screenNumber)] || []
    if (cuesOnScreen.length === 0) return []

    const currentIndex = Number(cueIndex)

    const cueStack = cuesOnScreen.filter((cue: Cue) => {
      const cueStartIndex = Number(cue.index)
      const cueSpan = getCueVisualSpanFromMap(cue, cueVisualSpanMap)
      const cueEndIndex = cueStartIndex + cueSpan - 1
      return currentIndex >= cueStartIndex && currentIndex <= cueEndIndex
    })

    return sortByLayerPriority(cueStack)
  }

  const renderCuePreview = (cue: Cue, screenNumber: number) => {
    if (isTextCue(cue)) {
      return (
        <CueText text={cue.text!} color={cue.textColor} size={cue.textSize} />
      )
    }

    if (cue?.file?.url) {
      if (isImageFile(cue.file)) {
        if (cue.spanScreens?.length && cue.spanScreens.length > 1) {
          return (
            <SpannedTilePreview
              imageSrc={cue.file.url}
              name={cue.name}
              spanScreens={cue.spanScreens}
              screenNumber={screenNumber}
              screenAspectRatios={screenAspectRatios}
              outputAspectRatio={outputAspectRatio}
            />
          )
        }

        return (
          <img
            src={cue.file.url}
            alt={cue.name}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        )
      }

      if (isVideoFile(cue.file)) {
        return (
          <video
            src={cue.file.url}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
            autoPlay
            loop
            muted
            playsInline
          />
        )
      }

      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            // "safe" matters: a plain centre overflows equally on both sides of a
            // scroll container, which puts the first tile before scrollLeft 0 where
            // no scrolling can reach it. safe centre falls back to start-alignment
            // as soon as the tiles no longer fit, which is exactly when the panel
            // is enlarged and they grow with it.
            justifyContent: "safe center",
            flex: 1,
          }}
        >
          Unsupported content type
        </div>
      )
    }

    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          // "safe" matters: a plain centre overflows equally on both sides of a
          // scroll container, which puts the first tile before scrollLeft 0 where
          // no scrolling can reach it. safe centre falls back to start-alignment
          // as soon as the tiles no longer fit, which is exactly when the panel
          // is enlarged and they grow with it.
          justifyContent: "safe center",
          width: "100%",
          height: "100%",
          backgroundColor: cue.color || "#333",
        }}
      />
    )
  }

  return (
    <div
      ref={stripRef}
      data-testid="screens-strip"
      style={{
        display: "flex",
        // Tiles are sized by height and keep their aspect ratio, so the strip
        // scrolls sideways instead of squeezing every screen thinner.
        // "safe" matters: a plain centre overflows equally on both sides of a
        // scroll container, which puts the first tile before scrollLeft 0 where
        // no scrolling can reach it. safe centre falls back to start-alignment
        // as soon as the tiles no longer fit, which is exactly when the panel
        // is enlarged and they grow with it.
        justifyContent: "safe center",
        alignItems: "center",
        backgroundColor: editModeBackground,
        gap: "10px",
        padding: "10px",
        paddingBottom: "15px",
        width: "100%",
        height: "100%",
        overflowX: "auto",
        overflowY: "hidden",
        scrollbarGutter: "stable",
      }}
    >
      {Array.from({ length: screenCount }).map((_, index) => {
        const screenNumber = index + 1
        const screenStack = getCurrentCueStackForScreen(screenNumber)

        const isFocused = focusedScreen === screenNumber

        return (
          <div
            key={screenNumber}
            ref={(node) => {
              tileRefs.current[screenNumber] = node
            }}
            data-testid={`screen-tile-${screenNumber}`}
            aria-current={isFocused ? "true" : undefined}
            style={{
              flex: "0 0 auto",
              height: "100%",
              width: "auto",
              minWidth: "240px",
              display: "flex",
              flexDirection: "column",
              backgroundColor: "black",
              color: "white",
              overflow: "hidden",
              position: "relative",
              aspectRatio: String(tileAspectRatioFor(screenNumber)),
              borderRadius: "6px",
              // outline, not border: it is outside layout, so highlighting a
              // tile cannot reflow the strip mid-scroll or shift the absolutely
              // positioned label and Open button.
              outline: isFocused
                ? "3px solid #BD5BFF"
                : "1px solid rgba(255, 255, 255, 0.12)",
              outlineOffset: isFocused ? "-3px" : "0px",
              boxShadow: isFocused
                ? "0 0 0 6px rgba(189, 91, 255, 0.22)"
                : "none",
              transition: "outline-color 120ms ease, box-shadow 140ms ease",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "10px",
                left: "10px",
                zIndex: 200,
              }}
            >
              Screen {screenNumber}
            </div>
            <Button
              size="xs"
              colorScheme={screens[screenNumber] ? "red" : "purple"}
              onClick={() => toggleScreenVisibility(screenNumber)}
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                zIndex: 200,
              }}
            >
              {screens[screenNumber] ? "Close" : "Open"}
            </Button>
            {onScreenAspectRatioChange && (
              <div
                style={{
                  position: "absolute",
                  bottom: "10px",
                  right: "10px",
                  zIndex: 200,
                  width: "76px",
                }}
              >
                <Select
                  size="xs"
                  aria-label={`Shape of screen ${screenNumber}`}
                  data-testid={`screen-shape-${screenNumber}`}
                  value={resolveScreenAspectRatio(
                    screenAspectRatios,
                    screenNumber,
                    outputAspectRatio
                  )}
                  onChange={(event) =>
                    onScreenAspectRatioChange(screenNumber, event.target.value)
                  }
                  bg="blackAlpha.700"
                  color="white"
                  borderColor="whiteAlpha.400"
                  borderRadius="6px"
                  _hover={{ borderColor: "whiteAlpha.600" }}
                  sx={{
                    "& option": { background: "#1b1420", color: "#f0e4ff" },
                  }}
                >
                  {OUTPUT_ASPECT_RATIO_OPTIONS.map(
                    (option: { value: string; label: string }) => (
                      <option key={option.value} value={option.value}>
                        {option.value}
                      </option>
                    )
                  )}
                </Select>
              </div>
            )}
            {screenStack.length > 0 ? (
              screenStack.map((cue) =>
                onSetCueFrame ? (
                  <ScreenLayerFrame
                    key={cue._id}
                    frame={cue.frame}
                    stageRef={{
                      current: tileRefs.current[screenNumber] ?? null,
                    }}
                    zIndex={5 + (100 - Number(cue.layer ?? 0))}
                    opacity={normalizeCueOpacity(cue.opacity)}
                    label={cue.name}
                    onCommit={(frame) => onSetCueFrame(cue, frame)}
                  >
                    {renderCuePreview(cue, screenNumber)}
                  </ScreenLayerFrame>
                ) : (
                  <div
                    key={cue._id}
                    style={{
                      position: "absolute",
                      ...cueFrameStyle(cue),
                      zIndex: 5 + (100 - Number(cue.layer ?? 0)),
                      opacity: normalizeCueOpacity(cue.opacity),
                      overflow: "hidden",
                    }}
                  >
                    {renderCuePreview(cue, screenNumber)}
                  </div>
                )
              )
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  // "safe" matters: a plain centre overflows equally on both sides of a
                  // scroll container, which puts the first tile before scrollLeft 0 where
                  // no scrolling can reach it. safe centre falls back to start-alignment
                  // as soon as the tiles no longer fit, which is exactly when the panel
                  // is enlarged and they grow with it.
                  justifyContent: "safe center",
                  flex: 1,
                }}
              >
                No content
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
