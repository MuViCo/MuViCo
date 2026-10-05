import { Box, usePrefersReducedMotion } from "@chakra-ui/react"
import { keyframes } from "@emotion/react"

import {
  normalizeTextColor,
  normalizeTextEffect,
  normalizeTextSize,
  textEffectDurationSeconds,
} from "./cueText"

interface CueTextProps {
  text: string
  color?: string
  size?: number
  effect?: string
  effectSpeed?: number
  effectLoop?: boolean
}

const crawl = keyframes`
  from {
    top: 100%;
    transform: translateX(-50%) rotateX(56deg) translateY(0);
  }
  to {
    top: 0%;
    transform: translateX(-50%) rotateX(56deg) translateY(-220%);
  }
`

const scrollUp = keyframes`
  from { top: 100%; transform: translateY(0); }
  to { top: 0%; transform: translateY(-100%); }
`

const scrollDown = keyframes`
  from { top: 0%; transform: translateY(-100%); }
  to { top: 100%; transform: translateY(0); }
`

const CueText = ({
  text,
  color,
  size,
  effect,
  effectSpeed,
  effectLoop = false,
}: CueTextProps) => {
  const resolvedEffect = normalizeTextEffect(effect)
  const prefersReducedMotion = usePrefersReducedMotion()
  const isAnimated = resolvedEffect !== "none" && !prefersReducedMotion
  const isCrawl = isAnimated && resolvedEffect === "crawl"
  const duration = `${textEffectDurationSeconds(effectSpeed)}s`
  const frames =
    resolvedEffect === "crawl"
      ? crawl
      : resolvedEffect === "scroll-up"
        ? scrollUp
        : scrollDown
  const maskImage = "linear-gradient(to top, #000 70%, transparent 100%)"

  return (
    <div
      data-testid="cue-text"
      data-effect={resolvedEffect}
      data-animated={isAnimated ? "true" : undefined}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        containerType: "size",
        display: "flex",
        alignItems: isAnimated ? "flex-start" : "center",
        justifyContent: "center",
        pointerEvents: "none",
        ...(isCrawl && {
          perspective: "320px",
          perspectiveOrigin: "50% 0%",
          maskImage,
          WebkitMaskImage: maskImage,
        }),
      }}
    >
      <Box
        as="span"
        animation={
          isAnimated
            ? `${frames} ${duration} linear ${effectLoop ? "infinite" : "forwards"}`
            : undefined
        }
        style={{
          color: normalizeTextColor(color),
          ["--cue-text-size" as string]: normalizeTextSize(size),
          fontSize: "calc(var(--cue-text-size) * 1cqh)",
          lineHeight: 1.2,
          textAlign: "center",
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
          ...(isCrawl
            ? {
                position: "absolute",
                top: "100%",
                left: "50%",
                width: "84%",
                transformOrigin: "50% 100%",
              }
            : { maxWidth: "92%" }),
          ...(isAnimated && !isCrawl && { position: "absolute", top: "100%" }),
        }}
      >
        {text}
      </Box>
    </div>
  )
}

export default CueText
