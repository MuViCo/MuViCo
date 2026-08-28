/**
 * makeResizable.ts
 *
 * Makes an element vertically resizable by dragging a handle.
 *
 * Usage:
 *   const dispose = makeResizable(baseElement, handleElement, options)
 *   // ...later
 *   dispose()
 *
 * The returned disposer must be called when the owning component unmounts.
 * The mousemove/mouseup listeners are attached to `document` only for the
 * duration of a drag, so between drags this costs nothing: the previous version
 * attached them once and never removed them, which left a mousemove handler
 * running on every pointer movement anywhere on the page for the rest of the
 * session, and added another full set on each remount.
 */

export interface ResizableOptions {
  /** Lower bound in px. */
  minHeight?: number
  /**
   * Upper bound in px. Resolved on every mousemove rather than once, so a
   * clamp expressed in terms of sibling elements keeps working while the
   * window is resized mid-drag.
   */
  maxHeight?: number | (() => number)
  /** Called with the committed height when the drag ends. */
  onResizeEnd?: (height: number) => void
}

function makeResizable(
  baseElement: HTMLElement,
  handleElement: HTMLElement,
  options: ResizableOptions = {}
): () => void {
  const { minHeight = 50, maxHeight, onResizeEnd } = options

  const resolveMaxHeight = (): number => {
    if (typeof maxHeight === "function") return maxHeight()
    if (typeof maxHeight === "number") return maxHeight
    return Number.POSITIVE_INFINITY
  }

  let latestHeight = baseElement.getBoundingClientRect().height

  const handleMouseMove = (event: MouseEvent): void => {
    const boxTop = baseElement.getBoundingClientRect().top
    // max can never be below min, or the clamp would invert.
    const max = Math.max(minHeight, resolveMaxHeight())

    latestHeight = Math.min(Math.max(event.clientY - boxTop, minHeight), max)
    baseElement.style.height = `${latestHeight}px`
  }

  const stopResizing = (): void => {
    document.removeEventListener("mousemove", handleMouseMove)
    document.removeEventListener("mouseup", stopResizing)
    // Restore rather than forcing "default", which would override a cursor set
    // by whatever is under the pointer.
    document.body.style.cursor = ""
    onResizeEnd?.(latestHeight)
  }

  const handleMouseDown = (event: MouseEvent): void => {
    // Prevent text selection while dragging.
    event.preventDefault()
    document.body.style.cursor = "ns-resize"
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", stopResizing)
  }

  handleElement.addEventListener("mousedown", handleMouseDown)

  return () => {
    handleElement.removeEventListener("mousedown", handleMouseDown)
    document.removeEventListener("mousemove", handleMouseMove)
    document.removeEventListener("mouseup", stopResizing)
  }
}

export default makeResizable
