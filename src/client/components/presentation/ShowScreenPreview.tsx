import { Box, Button, Text } from "@chakra-ui/react"
import { useState } from "react"
import type { SyntheticEvent } from "react"
import { isImageFile, isVideoFile } from "../utils/fileTypeUtils"
import { normalizeCueOpacity } from "../utils/cueOpacityUtils"
import { computeScreenSpanLayout } from "../utils/screenSpanLayout"
import type { Cue } from "../../types"

interface ShowScreenPreviewProps {
  screenNumber: number
  cues: Cue[]
  isOnline?: boolean
  compact?: boolean
  label?: string
  onOpen?: () => void
}

const renderSpannedImage = (cue: Cue, screenNumber: number) => (
  <SpannedPreview cue={cue} screenNumber={screenNumber} />
)

const SpannedPreview = ({
  cue,
  screenNumber,
}: {
  cue: Cue
  screenNumber: number
}) => {
  const [aspectRatio, setAspectRatio] = useState<number | null>(null)
  const spanScreens = cue.spanScreens ?? [screenNumber]
  const orderedScreens = [...spanScreens].sort((a, b) => a - b)
  const position = Math.max(0, orderedScreens.indexOf(screenNumber))

  const handleLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = event.currentTarget
    if (naturalWidth && naturalHeight)
      setAspectRatio(naturalWidth / naturalHeight)
  }

  if (!aspectRatio) {
    return (
      <>
        <img
          src={cue.file?.url}
          alt={cue.name}
          className="show-preview-media"
        />
        <img
          src={cue.file?.url}
          alt=""
          onLoad={handleLoad}
          style={{ display: "none" }}
        />
      </>
    )
  }

  const { canvasWidth, canvasHeight } = computeScreenSpanLayout(
    orderedScreens,
    {},
    aspectRatio
  )
  const tileWidth = canvasWidth / orderedScreens.length
  const tileHeight = tileWidth / (16 / 9)
  const x =
    orderedScreens.length > 1
      ? (position / (orderedScreens.length - 1)) * 100
      : 0

  return (
    <Box
      role="img"
      aria-label={cue.name}
      position="absolute"
      inset={0}
      bgImage={`url(${cue.file?.url})`}
      bgRepeat="no-repeat"
      bgPosition={`${x}% 50%`}
      bgSize={`${(canvasWidth / tileWidth) * 100}% ${(canvasHeight / tileHeight) * 100}%`}
    />
  )
}

const CueMedia = ({
  cue,
  screenNumber,
}: {
  cue: Cue
  screenNumber: number
}) => {
  if (!cue.file)
    return <Box position="absolute" inset={0} bg={cue.color ?? "#000"} />
  if (isImageFile(cue.file)) {
    if ((cue.spanScreens?.length ?? 0) > 1) {
      return renderSpannedImage(cue, screenNumber)
    }
    return (
      <img src={cue.file.url} alt={cue.name} className="show-preview-media" />
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
}: ShowScreenPreviewProps) => {
  const visibleNames = cues.map((cue) => cue.name).filter(Boolean)

  return (
    <Box
      className={`show-screen-preview ${compact ? "show-screen-preview-compact" : ""} ${isOnline ? "" : "show-screen-preview-offline"}`}
      data-testid={`show-screen-${screenNumber}`}
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
                  inset={0}
                  zIndex={100 - Number(cue.layer ?? index)}
                  opacity={normalizeCueOpacity(cue.opacity)}
                  overflow="hidden"
                >
                  <CueMedia cue={cue} screenNumber={screenNumber} />
                </Box>
              ))
            : null}
      </Box>
    </Box>
  )
}

export default ShowScreenPreview
