/**
 * Screen.jsx
 * Component responsible for rendering media cues on individual screens during presentation mode.
 *
 * Key Features:
 * - Opens a new browser window for each screen and renders media cues based on the current presentation state.
 * - Supports images, videos, and audio files, with conditional rendering based on file type.
 * - Implements transitions between cues using Emotion for CSS-in-JS styling.
 * - Falls back to a plain black screen when the current frame has no cue.
 * - Listens for changes in the assigned cue data and updates the displayed media accordingly.
 * - Cleans up resources and event listeners when the screen is closed or unmounted.
 */

import { useEffect, useRef, useState } from "react"
import type { SyntheticEvent } from "react"
import ReactDOM from "react-dom"
import { Box, Image, usePrefersReducedMotion } from "@chakra-ui/react"
import { isType } from "../utils/fileTypeUtils"
import createCache from "@emotion/cache"
import type { EmotionCache } from "@emotion/cache"
import { CacheProvider } from "@emotion/react"
import type { Keyframes } from "@emotion/react"
import { getAnims } from "../../utils/transitionUtils"
import { scheduleAt } from "../../utils/syncedTransition"
import { normalizeCueOpacity } from "../utils/cueOpacityUtils"
import { computeScreenSpanLayout } from "../utils/screenSpanLayout"
import { useVideoSpanSync } from "../utils/videoSpanSync"
import { imageEffectAnimation } from "../utils/cueImageAnimation"
import CueText from "../utils/CueText"
import { isTextCue } from "../utils/cueText"
import { parseAspectRatio } from "../../../constants.js"
import { cueFrameStyle } from "../utils/cueFrame"
import type { Cue } from "../../types"

const mediaFillProps = {
  width: "100%",
  height: "100%",
  objectFit: "contain",
} as const

// How long an entering or leaving cue layer animates for.
const TRANSITION_ANIMATION_MS = 500

// Literal, not Chakra tokens: those resolve to CSS variables the popup
// document never gets, so colours silently drop out of an output.
const SCREEN_BACKGROUND = "#000000"
const SCREEN_FOREGROUND = "#ffffff"

// Resolves a cue's media URL to its frozen Object URL (see
// EditModeContainer's freezeMediaUrl) when one is available, falling back
// to the live URL otherwise -- not yet frozen, or the freeze itself failed.
const resolveMediaSrc = (
  url: string | undefined,
  overrides?: Record<string, string>
): string | undefined => (url ? (overrides?.[url] ?? url) : url)

// An image cue that spans several screens. Renders the normal full-bleed
// "contain" image until the image's natural size is known (a hidden probe
// <img> reports it via onLoad), then switches to a cropped slice of the
// full multi-screen canvas -- see screenSpanLayout.ts for the geometry.
interface SpannedImageProps {
  imageSrc: string
  name?: string
  spanScreens: number[]
  screenNumber: string | number
  screenWidths?: Record<number, number>
  animation?: string
}

const SpannedImage = ({
  imageSrc,
  name,
  spanScreens,
  screenNumber,
  screenWidths,
  animation,
}: SpannedImageProps) => {
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
        <Image
          src={imageSrc}
          alt={name}
          {...mediaFillProps}
          style={{ animation }}
        />
        <img
          data-testid="span-image-probe"
          src={imageSrc}
          alt=""
          onLoad={handleProbeLoad}
          style={{ display: "none" }}
        />
      </>
    )
  }

  const { canvasWidth, canvasHeight, offsets } = computeScreenSpanLayout(
    spanScreens,
    screenWidths || {},
    aspectRatio
  )
  const offsetPx = offsets[Number(screenNumber)] ?? 0

  return (
    <div
      role="img"
      aria-label={name}
      style={{
        width: "100%",
        height: "100%",
        backgroundImage: `url(${imageSrc})`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: `-${offsetPx}px 50%`,
        backgroundSize: `${canvasWidth}px ${canvasHeight}px`,
        animation,
      }}
    />
  )
}

interface SpannedVideoProps {
  videoSrc: string
  cueId: string
  spanScreens: number[]
  screenNumber: string | number
  screenWidths?: Record<number, number>
}

const SpannedVideo = ({
  videoSrc,
  cueId,
  spanScreens,
  screenNumber,
  screenWidths,
}: SpannedVideoProps) => {
  const [aspectRatio, setAspectRatio] = useState<number | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  useVideoSpanSync(cueId, Number(screenNumber), videoRef, true)

  const handleLoadedMetadata = (event: SyntheticEvent<HTMLVideoElement>) => {
    const { videoWidth, videoHeight } = event.currentTarget
    if (videoWidth > 0 && videoHeight > 0) {
      setAspectRatio(videoWidth / videoHeight)
    }
  }

  const videoStyle = aspectRatio
    ? (() => {
        const { canvasWidth, canvasHeight, offsets } = computeScreenSpanLayout(
          spanScreens,
          screenWidths || {},
          aspectRatio
        )
        const offsetPx = offsets[Number(screenNumber)] ?? 0
        return {
          position: "absolute" as const,
          left: `-${offsetPx}px`,
          top: 0,
          width: `${canvasWidth}px`,
          height: `${canvasHeight}px`,
          maxWidth: "none",
          maxHeight: "none",
        }
      })()
    : mediaFillProps

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <video
        ref={videoRef}
        src={videoSrc}
        autoPlay
        loop
        muted
        onLoadedMetadata={handleLoadedMetadata}
        style={videoStyle}
      />
    </div>
  )
}

const renderMedia = (
  cue: Cue,
  screenNumber: string | number,
  screenWidths?: Record<number, number>,
  prefersReducedMotion = false,
  mediaUrlOverrides?: Record<string, string>
) => {
  const { file, name, color, spanScreens } = cue

  if (!file) {
    if (isTextCue(cue)) {
      return (
        <CueText
          text={cue.text as string}
          color={cue.textColor}
          size={cue.textSize}
          effect={cue.textEffect}
          effectSpeed={cue.textEffectSpeed}
          effectLoop={cue.textEffectLoop}
        />
      )
    }
    return <Box bg={color} width="100%" height="100%" />
  }

  if (isType.image(file)) {
    const imageSrc =
      resolveMediaSrc(file.url, mediaUrlOverrides) || `/${file.name}`
    const animation = imageEffectAnimation(cue, prefersReducedMotion)

    if ((spanScreens?.length ?? 0) > 1) {
      return (
        <SpannedImage
          imageSrc={imageSrc}
          name={name}
          spanScreens={spanScreens as number[]}
          screenNumber={screenNumber}
          screenWidths={screenWidths}
          animation={animation}
        />
      )
    }

    return (
      <Image
        src={imageSrc}
        alt={name}
        {...mediaFillProps}
        style={{ animation }}
      />
    )
  }
  // check if media is video
  if (isType.video(file)) {
    const videoSrc = resolveMediaSrc(file.url, mediaUrlOverrides)

    if ((spanScreens?.length ?? 0) > 1) {
      return (
        <SpannedVideo
          videoSrc={videoSrc as string}
          cueId={cue._id}
          spanScreens={spanScreens as number[]}
          screenNumber={screenNumber}
          screenWidths={screenWidths}
        />
      )
    }

    return <video src={videoSrc} style={mediaFillProps} autoPlay loop muted />
  }
  // check if media is audio
  if (isType.audio(file)) {
    const audioSrc = resolveMediaSrc(file.url, mediaUrlOverrides)
    return (
      <audio autoPlay loop controls style={{ width: "100%" }}>
        <source src={audioSrc} type={file.mimeType || "audio/mpeg"} />
        Your browser does not support the audio element.
      </audio>
    )
  }
  // if no media file, render a solid color background
  return <Box bg={color} width="100%" height="100%" />
  // return <Text>Unsupported media type.</Text>
}

type CueStack = Cue[] | Cue | null | undefined

const normalizeCueStack = (screenData: CueStack): Cue[] => {
  if (Array.isArray(screenData)) {
    return screenData
  }

  return screenData ? [screenData] : []
}

const cueStackKey = (cueStack: CueStack) =>
  normalizeCueStack(cueStack)
    .map(
      (cue) =>
        `${cue?._id || ""}:${cue?.index ?? ""}:${cue?.screen ?? ""}:${cue?.layer ?? 0}:${cue?.file?.url || ""}:${cue?.name || ""}:${cue?.color || ""}:${cue?.text || ""}:${cue?.textColor || ""}:${cue?.textSize ?? ""}:${normalizeCueOpacity(cue?.opacity)}`
    )
    .join("|")

const cueIdentity = (cue: Cue) =>
  `${cue?._id || cue?.name || "cue"}:${cue?.layer ?? 0}`

const renderCueLayers = (
  currentScreenData: CueStack,
  previousScreenData: CueStack,
  screenNumber: string | number,
  screenWidths: Record<number, number> | undefined,
  prefersReducedMotion: boolean,
  isRevealed: boolean,
  enterAnimStyle: string,
  exitAnimStyle: string,
  mediaUrlOverrides?: Record<string, string>
) => {
  const currentCueStack = normalizeCueStack(currentScreenData)
  const previousCueStack = normalizeCueStack(previousScreenData)
  const currentIdentities = new Set(currentCueStack.map(cueIdentity))
  const previousIdentities = new Set(previousCueStack.map(cueIdentity))

  const entries = [
    ...currentCueStack.map((cue) => ({
      cue,
      isIncoming: true,
      isNew: !previousIdentities.has(cueIdentity(cue)),
    })),
    ...previousCueStack
      .filter((cue) => !currentIdentities.has(cueIdentity(cue)))
      .map((cue) => ({ cue, isIncoming: false, isNew: false })),
  ]

  return (
    <>
      {entries.map(({ cue, isIncoming, isNew }) => (
        <Box
          key={cueIdentity(cue)}
          data-testid={isIncoming ? "incoming-cue-layer" : "outgoing-cue-layer"}
          data-revealed={isIncoming ? (isNew ? isRevealed : true) : undefined}
          position="absolute"
          {...cueFrameStyle(cue)}
          zIndex={100 - Number(cue.layer ?? 0)}
          opacity={
            isIncoming && isNew && !isRevealed
              ? 0
              : normalizeCueOpacity(cue.opacity)
          }
          pointerEvents={
            isIncoming && isNew && !isRevealed ? "none" : undefined
          }
          display="flex"
          justifyContent="center"
          alignItems="center"
          overflow="hidden"
          animation={
            !isIncoming
              ? isRevealed
                ? exitAnimStyle
                : "none"
              : isNew
                ? isRevealed
                  ? enterAnimStyle
                  : "none"
                : undefined
          }
        >
          {renderMedia(
            cue,
            screenNumber,
            screenWidths,
            prefersReducedMotion,
            mediaUrlOverrides
          )}
        </Box>
      ))}
    </>
  )
}

interface ScreenContentProps {
  screenNumber: string | number
  currentScreenData: CueStack
  previousScreenData: CueStack
  transitionType?: string
  screenWidths?: Record<number, number>
  isBlackout?: boolean
  outputAspectRatio?: string
  isRevealed?: boolean
  mediaUrlOverrides?: Record<string, string>
}

const ScreenContent = ({
  screenNumber,
  currentScreenData,
  previousScreenData,
  transitionType,
  screenWidths,
  isBlackout,
  outputAspectRatio,
  isRevealed = true,
  mediaUrlOverrides,
}: ScreenContentProps) => {
  const { enter: enterAnim, exit: exitAnim } = getAnims(
    transitionType ?? "fade"
  )
  const animStyle = (kf: Keyframes | null) =>
    kf ? `${kf} ${TRANSITION_ANIMATION_MS}ms ease-in-out forwards` : "none"
  const prefersReducedMotion = usePrefersReducedMotion()

  return (
    <Box
      style={{
        backgroundColor: SCREEN_BACKGROUND,
        color: SCREEN_FOREGROUND,
      }}
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      position="relative"
      overflow="hidden"
    >
      <Box
        data-testid="screen-stage"
        position="absolute"
        inset="0"
        margin="auto"
        width="100%"
        height="100%"
        maxWidth="100%"
        maxHeight="100%"
        overflow="hidden"
        sx={{ aspectRatio: String(parseAspectRatio(outputAspectRatio)) }}
      >
        {renderCueLayers(
          currentScreenData,
          previousScreenData,
          screenNumber,
          screenWidths,
          prefersReducedMotion,
          isRevealed,
          animStyle(enterAnim),
          animStyle(exitAnim),
          mediaUrlOverrides
        )}
      </Box>
      {isBlackout && (
        <Box
          data-testid="screen-blackout"
          position="absolute"
          inset="0"
          zIndex={1000}
          style={{ backgroundColor: SCREEN_BACKGROUND }}
        />
      )}
    </Box>
  )
}

interface ScreenProps {
  screenNumber: string | number
  screenData: CueStack
  isVisible: boolean
  onClose: (screenNumber: string | number) => void
  transitionType?: string
  screenWidths?: Record<number, number>
  onWidthChange?: (screenNumber: number, width: number) => void
  isBlackout?: boolean
  outputAspectRatio?: string
  transitionAt?: number
  /**
   * originalUrl -> frozen Object URL, from EditModeContainer's
   * freezeMediaUrl. When a cue's media URL has an entry here, it's used
   * instead of the live (S3) URL so this popup never re-fetches over the
   * network -- see the module doc for why.
   */
  mediaUrlOverrides?: Record<string, string>
}

const Screen = ({
  screenNumber,
  screenData,
  isVisible,
  onClose,
  transitionType,
  screenWidths,
  onWidthChange,
  isBlackout = false,
  outputAspectRatio,
  transitionAt,
  mediaUrlOverrides,
}: ScreenProps) => {
  const windowRef = useRef<Window | null>(null)
  const [isWindowReady, setIsWindowReady] = useState(false)
  const [currentScreenData, setCurrentScreenData] = useState<Cue[] | null>(null)
  const [previousScreenData, setPreviousScreenData] = useState<Cue[] | null>(
    null
  )
  const [isRevealed, setIsRevealed] = useState(true)
  const cancelRevealRef = useRef<(() => void) | null>(null)
  const [emotionCache, setEmotionCache] = useState<EmotionCache | null>(null)

  const copyChakraStyles = () => {
    const parentStyles = document.querySelectorAll(
      "style, link[rel='stylesheet']"
    )
    parentStyles.forEach((style) => {
      if (windowRef.current) {
        windowRef.current.document.head.appendChild(style.cloneNode(true))
      }
    })
  }

  useEffect(() => {
    if (isVisible) {
      if (!windowRef.current) {
        const newWindow = window.open(
          "",
          `Screen ${screenNumber}`,
          "width=800,height=600"
        )
        if (!newWindow) {
          onClose(screenNumber)
          return
        }
        windowRef.current = newWindow
        setIsWindowReady(true)

        // Reset default browser margins in the new window to avoid the 8px offset.
        if (newWindow?.document?.documentElement?.style) {
          const { document: doc } = newWindow
          doc.documentElement.style.margin = "0"
          doc.documentElement.style.padding = "0"
          doc.documentElement.style.width = "100%"
          doc.documentElement.style.height = "100%"
          doc.documentElement.style.overflow = "hidden"
          // Letterboxing leaves the document's own background showing.
          doc.documentElement.style.background = SCREEN_BACKGROUND
          if (doc.body?.style) {
            doc.body.style.margin = "0"
            doc.body.style.padding = "0"
            doc.body.style.width = "100%"
            doc.body.style.height = "100%"
            doc.body.style.overflow = "hidden"
            doc.body.style.background = SCREEN_BACKGROUND
          }
        }

        // Handle window close event to reset the reference
        newWindow.addEventListener("beforeunload", () => {
          windowRef.current = null
          onClose(screenNumber)
          setIsWindowReady(false)
          setEmotionCache(null)
          setCurrentScreenData(null)
          setPreviousScreenData(null)
        })
      }
    }

    if (!isVisible && windowRef.current) {
      windowRef.current.close()
      windowRef.current = null
      setIsWindowReady(false)
      setEmotionCache(null)
      setCurrentScreenData(null)
      setPreviousScreenData(null)
    }

    // Cleanup on unmount
    return () => {
      if (windowRef.current) {
        windowRef.current.close()
        windowRef.current = null
        setIsWindowReady(false)
        setEmotionCache(null)
        setCurrentScreenData(null)
        setPreviousScreenData(null)
        onClose(screenNumber)
      }
    }
  }, [isVisible, screenNumber, onClose])

  useEffect(() => {
    if (!isVisible) return undefined
    const interval = window.setInterval(() => {
      if (windowRef.current?.closed) {
        windowRef.current = null
        setIsWindowReady(false)
        setEmotionCache(null)
        setCurrentScreenData(null)
        setPreviousScreenData(null)
        onClose(screenNumber)
      }
    }, 750)
    return () => window.clearInterval(interval)
  }, [isVisible, onClose, screenNumber])

  useEffect(() => {
    if (windowRef.current && !emotionCache) {
      // Set up a cache to inject Emotion's styles to portal (e.g. fadeOut and fadeIn effects)
      const cache = createCache({
        key: "new-window",
        container: windowRef.current.document.head,
      })
      setEmotionCache(cache)
    }
  }, [isWindowReady, emotionCache])

  useEffect(() => {
    // After the window is ready, copy the Chakra styles
    if (isWindowReady && windowRef.current) {
      copyChakraStyles()
    }
  }, [isWindowReady])

  // Report this popup's live width up so a spanning cue's neighbors can
  // compute their crop against it. Only screens actually referenced by some
  // cue's spanScreens are tracked by the parent (see
  // EditModeContainer.tsx's handleScreenWidthChange), so reporting on every
  // open screen unconditionally is harmless.
  useEffect(() => {
    if (!isWindowReady || !windowRef.current || !onWidthChange) {
      return undefined
    }

    const reportWidth = () => {
      const width = windowRef.current?.innerWidth
      if (width) {
        onWidthChange(Number(screenNumber), width)
      }
    }

    reportWidth()
    windowRef.current.addEventListener("resize", reportWidth)
    return () => {
      windowRef.current?.removeEventListener("resize", reportWidth)
    }
  }, [isWindowReady, screenNumber, onWidthChange])

  // Boolean, not the value itself, so this effect reacts to an external
  // reset (null) without re-running (and cancelling its own reveal) on
  // every content swap it makes itself.
  const hasCurrentScreenData = currentScreenData !== null

  useEffect(() => {
    // Update media states when screenData changes
    const nextScreenData = normalizeCueStack(screenData)

    if (!isWindowReady && !windowRef.current) {
      return
    }

    if (cueStackKey(currentScreenData) !== cueStackKey(nextScreenData)) {
      cancelRevealRef.current?.()

      if (!currentScreenData) {
        setPreviousScreenData(null)
        setCurrentScreenData(nextScreenData)
        setIsRevealed(true)
      } else {
        setPreviousScreenData(currentScreenData)
        setCurrentScreenData(nextScreenData)
        setIsRevealed(false)

        const revealAt = transitionAt ?? Date.now()
        cancelRevealRef.current = scheduleAt(revealAt, () => {
          setIsRevealed(true)
        })
      }
    }

    const firstCue = nextScreenData[0]
    const frameLabel =
      firstCue?.index === undefined
        ? null
        : firstCue.index === 0
          ? "Starting Frame"
          : `Frame ${firstCue.index}`
    if (windowRef.current) {
      windowRef.current.document.title = frameLabel
        ? `Screen ${screenNumber} • ${frameLabel}`
        : `Screen ${screenNumber}`
    }

    // No cleanup cancelling the reveal here. This effect re-runs on every
    // parent render, since `screenData` is rebuilt each time, and cancelling
    // then would drop a reveal that has already been scheduled: the branch
    // above only re-arms it when the cue content changed, so the incoming
    // layer would stay at opacity 0 and the outgoing one on screen -- the
    // screen keeps showing the previous frame. Re-arming before scheduling
    // (above) already prevents overlapping timers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    screenData,
    hasCurrentScreenData,
    transitionAt,
    isWindowReady,
    screenNumber,
  ])

  useEffect(
    () => () => {
      cancelRevealRef.current?.()
    },
    []
  )

  // Drop the outgoing layer once it has finished leaving. It keeps its own
  // opacity, so a transition with no exit animation ("none") would otherwise
  // leave it on screen for good -- and above the incoming layer, since equal
  // zIndex falls back to DOM order. Even with an animation, leaving it
  // mounted keeps a hidden video decoding for the rest of the frame.
  useEffect(() => {
    if (!isRevealed || !previousScreenData) return undefined

    const { exit } = getAnims(transitionType ?? "fade")
    const timeoutId = window.setTimeout(
      () => setPreviousScreenData(null),
      exit ? TRANSITION_ANIMATION_MS : 0
    )
    return () => window.clearTimeout(timeoutId)
  }, [isRevealed, previousScreenData, transitionType])

  // Only render the portal when the window is ready
  return windowRef.current && isWindowReady && emotionCache
    ? ReactDOM.createPortal(
        //inject Emotion styles to portal (e.g. fadeOut, fadeIn effects)
        <CacheProvider value={emotionCache}>
          <ScreenContent
            screenNumber={screenNumber}
            currentScreenData={currentScreenData}
            previousScreenData={previousScreenData}
            transitionType={transitionType}
            screenWidths={screenWidths}
            isBlackout={isBlackout}
            outputAspectRatio={outputAspectRatio}
            isRevealed={isRevealed}
            mediaUrlOverrides={mediaUrlOverrides}
          />
        </CacheProvider>,
        windowRef.current.document.body // render to new window's document.body
      )
    : null
}

export default Screen
