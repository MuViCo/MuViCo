import { Box, Button, Text, usePrefersReducedMotion } from "@chakra-ui/react"
import { useState } from "react"
import type { SyntheticEvent } from "react"
import { isImageFile, isVideoFile } from "../utils/fileTypeUtils"
import { normalizeCueOpacity } from "../utils/cueOpacityUtils"
import { cueFrameStyle } from "../utils/cueFrame"
import {
  computeScreenSpanLayout,
  screenWidthMapFromRatios,
  spanMediaStyle,
} from "../utils/screenSpanLayout"
import { useMediaAspectRatio } from "../utils/useMediaAspectRatio"
import { imageEffectAnimation } from "../utils/cueImageAnimation"
import {
  parseAspectRatio,
  resolveScreenAspectRatio,
} from "../../../constants.js"
import CueText from "../utils/CueText"
import { isTextCue } from "../utils/cueText"
import type { Cue } from "../../types"

interface ShowScreenPreviewProps {
  screenNumber: number
  cues: Cue[]
  screenAspectRatios?: Record<string, string>
  outputAspectRatio?: string
  isOnline?: boolean
  compact?: boolean
  label?: string
  onOpen?: () => void
}

const renderSpannedImage = (
  cue: Cue,
  screenNumber: number,
  screenAspectRatios?: Record<string, string>,
  outputAspectRatio?: string,
  animation?: string
) => (
  <SpannedPreview
    cue={cue}
    screenNumber={screenNumber}
    screenAspectRatios={screenAspectRatios}
    outputAspectRatio={outputAspectRatio}
    animation={animation}
  />
)

const SpannedPreview = ({
  cue,
  screenNumber,
  screenAspectRatios,
  outputAspectRatio,
  animation,
}: {
  cue: Cue
  screenNumber: number
  screenAspectRatios?: Record<string, string>
  outputAspectRatio?: string
  animation?: string
}) => {
  const { aspectRatio, probeRef, onLoad } = useMediaAspectRatio()
  const spanScreens = cue.spanScreens ?? [screenNumber]
  const orderedScreens = [...spanScreens].sort((a, b) => a - b)
  const position = Math.max(0, orderedScreens.indexOf(screenNumber))

  if (!aspectRatio) {
    return (
      <>
        <img
          src={cue.file?.url}
          alt={cue.name}
          className="show-preview-media"
          style={{ animation }}
        />
        <img
          src={cue.file?.url}
          alt=""
          ref={probeRef}
          onLoad={onLoad}
          style={{ display: "none" }}
        />
      </>
    )
  }

  const widthMap = screenWidthMapFromRatios(
    orderedScreens,
    screenAspectRatios,
    outputAspectRatio
  )
  // The widths are ratios against a screen height of 1, so that is the unit
  // the canvas height is in too.
  const layout = computeScreenSpanLayout(
    orderedScreens,
    widthMap,
    aspectRatio,
    {
      canvasHeight: 1,
      fill: cue.spanFill,
      position: cue.spanPosition,
    }
  )

  return (
    <Box position="absolute" inset={0} overflow="hidden">
      <Box
        role="img"
        aria-label={cue.name}
        data-testid="span-media"
        position="absolute"
        bgImage={`url(${cue.file?.url})`}
        bgRepeat="no-repeat"
        bgSize="100% 100%"
        style={{ animation, ...spanMediaStyle(layout, screenNumber) }}
      />
    </Box>
  )
}

const CueMedia = ({
  cue,
  screenNumber,
  screenAspectRatios,
  outputAspectRatio,
}: {
  cue: Cue
  screenNumber: number
  screenAspectRatios?: Record<string, string>
  outputAspectRatio?: string
}) => {
  const prefersReducedMotion = usePrefersReducedMotion()

  if (!cue.file) {
    if (isTextCue(cue)) {
      return (
        <CueText
          text={cue.text!}
          color={cue.textColor}
          size={cue.textSize}
          effect={cue.textEffect}
          effectSpeed={cue.textEffectSpeed}
          effectLoop={cue.textEffectLoop}
        />
      )
    }
    return <Box position="absolute" inset={0} bg={cue.color ?? "#000"} />
  }
  if (isImageFile(cue.file)) {
    const animation = imageEffectAnimation(cue, prefersReducedMotion)

    if ((cue.spanScreens?.length ?? 0) > 1) {
      return renderSpannedImage(
        cue,
        screenNumber,
        screenAspectRatios,
        outputAspectRatio,
        animation
      )
    }
    return (
      <img
        src={cue.file.url}
        alt={cue.name}
        className="show-preview-media"
        style={{ animation }}
      />
    )
  }
  if (isVideoFile(cue.file)) {
    return (
      <video
        src={cue.file.url}
        className="show-preview-media"
        autoPlay
        loop
        muted
        playsInline
      />
    )
  }
  return <Box position="absolute" inset={0} bg={cue.color ?? "#000"} />
}

const ShowScreenPreview = ({
  screenNumber,
  cues,
  isOnline = true,
  compact = false,
  label,
  onOpen,
  screenAspectRatios,
  outputAspectRatio,
}: ShowScreenPreviewProps) => {
  const visibleNames = cues.map((cue) => cue.name).filter(Boolean)
  const tileAspectRatio = parseAspectRatio(
    resolveScreenAspectRatio(
      screenAspectRatios,
      screenNumber,
      outputAspectRatio
    )
  )

  return (
    <Box
      className={`show-screen-preview ${compact ? "show-screen-preview-compact" : ""} ${isOnline ? "" : "show-screen-preview-offline"}`}
      data-testid={`show-screen-${screenNumber}`}
      style={{ aspectRatio: String(tileAspectRatio) }}
    >
      <Box className="show-screen-preview-header">
        <Text as="span">{label ?? `Screen ${screenNumber}`}</Text>
        {isOnline &&
          cues.map((cue) => (
            <Text key={cue._id} as="span" className="show-layer-badge">
              L{Number(cue.layer ?? 0) + 1}
            </Text>
          ))}
        <Text as="span" className="show-screen-cue-name">
          {isOnline
            ? visibleNames.join(" / ") || "No content"
            : "window closed"}
        </Text>
        <Box className={`show-online-dot ${isOnline ? "is-online" : ""}`} />
      </Box>
      <Box className="show-screen-preview-canvas">
        {!isOnline
          ? onOpen && (
              <Button size="sm" variant="muvico-secondary" onClick={onOpen}>
                Open display {screenNumber}
              </Button>
            )
          : cues.length
            ? cues.map((cue, index) => (
                <Box
                  key={cue._id}
                  position="absolute"
                  {...cueFrameStyle(cue)}
                  zIndex={100 - Number(cue.layer ?? index)}
                  opacity={normalizeCueOpacity(cue.opacity)}
                  overflow="hidden"
                >
                  <CueMedia
                    cue={cue}
                    screenNumber={screenNumber}
                    screenAspectRatios={screenAspectRatios}
                    outputAspectRatio={outputAspectRatio}
                  />
                </Box>
              ))
            : null}
      </Box>
    </Box>
  )
}

export default ShowScreenPreview
