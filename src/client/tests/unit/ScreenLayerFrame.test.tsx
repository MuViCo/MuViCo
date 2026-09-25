import { render, screen, fireEvent, act } from "@testing-library/react"
import "@testing-library/jest-dom"
import { createRef } from "react"

import ScreenLayerFrame from "../../components/presentation/ScreenLayerFrame"

const renderFrame = (onCommit = jest.fn(), isSelected = true) => {
  const onSelect = jest.fn()
  const stageRef = createRef<HTMLElement>()
  const { container } = render(
    <div
      ref={stageRef as never}
      style={{ position: "relative", width: "200px", height: "100px" }}
    >
      <ScreenLayerFrame
        frame={{ x: 0.25, y: 0.25, width: 0.5, height: 0.5 }}
        stageRef={stageRef}
        zIndex={10}
        opacity={1}
        label="Banner"
        isSelected={isSelected}
        onSelect={onSelect}
        onCommit={onCommit}
      >
        <div data-testid="media" />
      </ScreenLayerFrame>
    </div>
  )

  const stage = container.firstChild as HTMLElement
  stage.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 200, height: 100 }) as DOMRect

  return { onCommit, onSelect }
}

describe("ScreenLayerFrame", () => {
  test("dragging the body reports a moved frame", async () => {
    const { onCommit } = renderFrame()

    fireEvent.mouseDown(screen.getByTestId("layer-frame-Banner"), {
      clientX: 0,
      clientY: 0,
    })
    await act(async () => {
      fireEvent.mouseMove(document, { clientX: 20, clientY: 10 })
      fireEvent.mouseUp(document)
    })

    expect(onCommit).toHaveBeenCalledTimes(1)
    const frame = onCommit.mock.calls[0][0]
    expect(frame.x).toBeCloseTo(0.35)
    expect(frame.y).toBeCloseTo(0.35)
    expect(frame.width).toBeCloseTo(0.5)
    expect(frame.height).toBeCloseTo(0.5)
  })

  test("dragging a corner handle resizes instead of moving", async () => {
    const { onCommit } = renderFrame()

    fireEvent.mouseDown(screen.getByTestId("layer-handle-Banner-se"), {
      clientX: 0,
      clientY: 0,
    })
    await act(async () => {
      fireEvent.mouseMove(document, { clientX: 20, clientY: 10 })
      fireEvent.mouseUp(document)
    })

    const frame = onCommit.mock.calls[0][0]
    expect(frame.x).toBeCloseTo(0.25)
    expect(frame.y).toBeCloseTo(0.25)
    expect(frame.width).toBeCloseTo(0.6)
    expect(frame.height).toBeCloseTo(0.6)
  })

  test("keeps the dragged position on screen until the new frame arrives", async () => {
    renderFrame()

    fireEvent.mouseDown(screen.getByTestId("layer-frame-Banner"), {
      clientX: 0,
      clientY: 0,
    })
    await act(async () => {
      fireEvent.mouseMove(document, { clientX: 20, clientY: 10 })
      fireEvent.mouseUp(document)
    })

    const layer = screen.getByTestId("layer-frame-Banner")
    expect(layer.style.left).toBe("35%")
    expect(layer.style.top).toBe("35%")
  })

  test("a click without moving commits nothing", async () => {
    const { onCommit } = renderFrame()

    fireEvent.mouseDown(screen.getByTestId("layer-frame-Banner"), {
      clientX: 0,
      clientY: 0,
    })
    await act(async () => {
      fireEvent.mouseUp(document)
    })

    expect(onCommit).not.toHaveBeenCalled()
  })

  test("shows the resize handles only for the selected layer", () => {
    renderFrame(jest.fn(), false)

    expect(
      screen.queryByTestId("layer-handle-Banner-se")
    ).not.toBeInTheDocument()
  })

  test("selects the layer as soon as it is grabbed", () => {
    const { onSelect } = renderFrame(jest.fn(), false)

    fireEvent.mouseDown(screen.getByTestId("layer-frame-Banner"), {
      clientX: 0,
      clientY: 0,
    })

    expect(onSelect).toHaveBeenCalled()
  })
})
