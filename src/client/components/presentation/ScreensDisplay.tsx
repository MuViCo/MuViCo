/**
 * screens display component for presentation mode, showing the content of each screen based on the cues and their timing
 * - Displays the content for each screen based on the cues and their timing
 * - Supports images, videos, and colored backgrounds as screen content
 * - Shows "No content" message if there are no cues for a screen at the current cue index
 * - Includes buttons to open/close each screen in edit mode
 * - Uses useMemo to optimize performance by memoizing the cue visual span map and cues sorted by screen
 * - Determines the current cue for each screen based on the cue index and the visual span of each cue
 */

import { Button } from "@chakra-ui/react"
import React, { useEffect, useMemo, useRef } from "react"
import { usePrefersReducedMotion } from "@chakra-ui/react"
import {
  buildCueVisualSpanMap,
  getCueVisualSpanFromMap,
} from "../utils/cueVisualSpanUtils"
import { isType } from "../utils/fileTypeUtils"
import { normalizeCueOpacity } from "../utils/cueOpacityUtils"

import type { Cue, CueFileMeta } from "../../types"

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
}: ScreensDisplayProps) => {
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

    const padding = 12
    const start = tile.offsetLeft - padding
    const end = tile.offsetLeft + tile.offsetWidth + padding
    const viewStart = strip.scrollLeft
    const viewEnd = viewStart + strip.clientWidth

    // Already fully visible: leave the user's scroll position alone.
    let next: number | null = null
    if (start < viewStart) next = start
    else if (end > viewEnd) next = end - strip.clientWidth
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
      const screenNumber = Number(cue.screen)
      if (!acc[screenNumber]) {
        acc[screenNumber] = []
      }
      acc[screenNumber].push(cue)
      return acc
    }, {})
  }, [cues])

  const getCleanUrl = (file?: CueFileMeta | null): string => {
    const url = file?.url || ""
    return String(url).split("?")[0].split("#")[0]
  }

  const isImageFile = (file?: CueFileMeta | null): boolean => {
    if (isType.image(file)) return true
    return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(getCleanUrl(file)) // check common image file extensions
  }

  const isVideoFile = (file?: CueFileMeta | null): boolean => {
    if (isType.video(file)) return true
    return /\.(mp4|webm|ogg|mov|m4v)$/i.test(getCleanUrl(file)) // check common video file extensions
  }

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

  const renderCuePreview = (cue: Cue) => {
    if (cue?.file?.url) {
      if (isImageFile(cue.file)) {
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
            justifyContent: "center",
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
          justifyContent: "center",
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
        justifyContent: "center",
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
              aspectRatio: "16/9",
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
            {screenStack.length > 0 ? (
              screenStack.map((cue) => (
                <div
                  key={cue._id}
                  style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 5 + (100 - Number(cue.layer ?? 0)),
                    opacity: normalizeCueOpacity(cue.opacity),
                  }}
                >
                  {renderCuePreview(cue)}
                </div>
              ))
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
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
