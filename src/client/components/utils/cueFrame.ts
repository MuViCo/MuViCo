import type { Cue } from "../../types"

export interface CueFrame {
  x: number
  y: number
  width: number
  height: number
}

export const FULL_FRAME: CueFrame = { x: 0, y: 0, width: 1, height: 1 }

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value))

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value)

export const normalizeCueFrame = (
  frame: Partial<CueFrame> | null | undefined
): CueFrame => {
  if (!frame) return FULL_FRAME

  const { x, y, width, height } = frame
  if (
    !isFiniteNumber(x) ||
    !isFiniteNumber(y) ||
    !isFiniteNumber(width) ||
    !isFiniteNumber(height)
  ) {
    return FULL_FRAME
  }

  if (width <= 0 || height <= 0) return FULL_FRAME

  return {
    x: clamp01(x),
    y: clamp01(y),
    width: clamp01(width),
    height: clamp01(height),
  }
}

export const cueFrameStyle = (
  cue: Pick<Cue, "frame"> | null | undefined
): {
  left: string
  top: string
  width: string
  height: string
} => {
  const { x, y, width, height } = normalizeCueFrame(cue?.frame)
  return {
    left: `${x * 100}%`,
    top: `${y * 100}%`,
    width: `${width * 100}%`,
    height: `${height * 100}%`,
  }
}

export const CUE_FRAME_PRESETS: ReadonlyArray<{
  label: string
  frame: CueFrame
}> = [
  { label: "Full", frame: FULL_FRAME },
  { label: "Left half", frame: { x: 0, y: 0, width: 0.5, height: 1 } },
  { label: "Right half", frame: { x: 0.5, y: 0, width: 0.5, height: 1 } },
  { label: "Top half", frame: { x: 0, y: 0, width: 1, height: 0.5 } },
  { label: "Bottom half", frame: { x: 0, y: 0.5, width: 1, height: 0.5 } },
  { label: "Centre", frame: { x: 0.25, y: 0.25, width: 0.5, height: 0.5 } },
]

export const isFullFrame = (
  frame: Partial<CueFrame> | null | undefined
): boolean => {
  const normalized = normalizeCueFrame(frame)
  return (
    normalized.x === FULL_FRAME.x &&
    normalized.y === FULL_FRAME.y &&
    normalized.width === FULL_FRAME.width &&
    normalized.height === FULL_FRAME.height
  )
}

export const MIN_FRAME_SIZE = 0.05

export type FrameHandle = "nw" | "ne" | "sw" | "se"

export const moveFrame = (
  frame: CueFrame,
  dx: number,
  dy: number
): CueFrame => {
  const { x, y, width, height } = normalizeCueFrame(frame)
  return {
    x: Math.min(Math.max(x + dx, 0), 1 - width),
    y: Math.min(Math.max(y + dy, 0), 1 - height),
    width,
    height,
  }
}

export const resizeFrame = (
  frame: CueFrame,
  handle: FrameHandle,
  dx: number,
  dy: number
): CueFrame => {
  const { x, y, width, height } = normalizeCueFrame(frame)
  const right = x + width
  const bottom = y + height

  let nextLeft = x
  let nextTop = y
  let nextRight = right
  let nextBottom = bottom

  if (handle === "nw" || handle === "sw") {
    nextLeft = Math.min(Math.max(x + dx, 0), right - MIN_FRAME_SIZE)
  } else {
    nextRight = Math.max(Math.min(right + dx, 1), x + MIN_FRAME_SIZE)
  }

  if (handle === "nw" || handle === "ne") {
    nextTop = Math.min(Math.max(y + dy, 0), bottom - MIN_FRAME_SIZE)
  } else {
    nextBottom = Math.max(Math.min(bottom + dy, 1), y + MIN_FRAME_SIZE)
  }

  return {
    x: nextLeft,
    y: nextTop,
    width: nextRight - nextLeft,
    height: nextBottom - nextTop,
  }
}
