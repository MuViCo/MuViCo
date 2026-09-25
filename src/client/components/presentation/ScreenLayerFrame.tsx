import { useCallback, useEffect, useRef, useState } from "react"
import type { ReactNode, RefObject } from "react"

import {
  cueFrameStyle,
  moveFrame,
  normalizeCueFrame,
  resizeFrame,
} from "../utils/cueFrame"
import type { CueFrame, FrameHandle } from "../utils/cueFrame"

const HANDLES: ReadonlyArray<{
  handle: FrameHandle
  cursor: string
  style: { top?: string; bottom?: string; left?: string; right?: string }
}> = [
  { handle: "nw", cursor: "nwse-resize", style: { top: "-4px", left: "-4px" } },
  {
    handle: "ne",
    cursor: "nesw-resize",
    style: { top: "-4px", right: "-4px" },
  },
  {
    handle: "sw",
    cursor: "nesw-resize",
    style: { bottom: "-4px", left: "-4px" },
  },
  {
    handle: "se",
    cursor: "nwse-resize",
    style: { bottom: "-4px", right: "-4px" },
  },
]

interface ScreenLayerFrameProps {
  frame: CueFrame | undefined
  stageRef: RefObject<HTMLElement | null>
  zIndex: number
  opacity: number
  label: string
  isSelected: boolean
  onSelect: () => void
  onCommit: (frame: CueFrame) => void
  children: ReactNode
}

const ScreenLayerFrame = ({
  frame,
  stageRef,
  zIndex,
  opacity,
  label,
  isSelected,
  onSelect,
  onCommit,
  children,
}: ScreenLayerFrameProps) => {
  const [draftFrame, setDraftFrame] = useState<CueFrame | null>(null)
  const draftRef = useRef<CueFrame | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    setDraftFrame(null)
    draftRef.current = null
  }, [frame])

  useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    },
    []
  )

  const startGesture = useCallback(
    (event: React.MouseEvent, handle: FrameHandle | null) => {
      const stage = stageRef.current
      if (!stage) return

      event.preventDefault()
      event.stopPropagation()

      const bounds = stage.getBoundingClientRect()
      if (bounds.width === 0 || bounds.height === 0) return

      const startFrame = normalizeCueFrame(frame)
      const startX = event.clientX
      const startY = event.clientY

      const onMove = (moveEvent: MouseEvent) => {
        const dx = (moveEvent.clientX - startX) / bounds.width
        const dy = (moveEvent.clientY - startY) / bounds.height
        const next = handle
          ? resizeFrame(startFrame, handle, dx, dy)
          : moveFrame(startFrame, dx, dy)
        draftRef.current = next
        if (rafRef.current === null) {
          rafRef.current = requestAnimationFrame(() => {
            rafRef.current = null
            setDraftFrame(draftRef.current)
          })
        }
      }

      const onUp = () => {
        document.removeEventListener("mousemove", onMove)
        document.removeEventListener("mouseup", onUp)
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current)
          rafRef.current = null
        }
        const committed = draftRef.current
        if (committed) {
          setDraftFrame(committed)
          onCommit(committed)
        }
      }

      document.addEventListener("mousemove", onMove)
      document.addEventListener("mouseup", onUp)
    },
    [frame, onCommit, stageRef]
  )

  const shownFrame = draftFrame ?? normalizeCueFrame(frame)

  return (
    <div
      data-testid={`layer-frame-${label}`}
      style={{
        position: "absolute",
        ...cueFrameStyle({ frame: shownFrame }),
        zIndex,
        opacity,
        overflow: "hidden",
        cursor: "move",
        outline: isSelected ? "2px solid #BD5BFF" : undefined,
        outlineOffset: "-2px",
      }}
      onMouseDown={(event) => {
        onSelect()
        startGesture(event, null)
      }}
    >
      {children}
      {isSelected &&
        HANDLES.map(({ handle, cursor, style }) => (
          <div
            key={handle}
            data-testid={`layer-handle-${label}-${handle}`}
            aria-label={`Resize ${label} ${handle}`}
            onMouseDown={(event) => startGesture(event, handle)}
            style={{
              position: "absolute",
              ...style,
              width: "10px",
              height: "10px",
              cursor,
              borderRadius: "2px",
              background: "#BD5BFF",
              border: "1px solid rgba(255,255,255,0.8)",
              zIndex: 10,
            }}
          />
        ))}
    </div>
  )
}

export default ScreenLayerFrame
