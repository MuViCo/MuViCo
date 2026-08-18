import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom"
import { RowHeaders } from "../../components/presentation/EditModeHeaders"
import { buildRowModel } from "../../components/utils/screenRowModel"

describe("EditModeHeaders RowHeaders", () => {
  const screenCount = 2
  const cues = [{ _id: "c1", cueType: "visual", screen: 1, layer: 1, index: 0 }]
  const rowModel = buildRowModel(screenCount, cues, {})

  const renderRowHeaders = (overrides = {}) => {
    const headerActionsRef = {
      current: {
        toggleAudioMute: jest.fn(),
        increaseScreenCount: jest.fn(),
        decreaseScreenCount: jest.fn(),
      },
    }
    const props = {
      rows: rowModel.rows,
      collapsedGroups: {},
      onToggleGroupCollapsed: jest.fn(),
      onAddVisualLayer: jest.fn(),
      onRemoveVisualLayer: jest.fn(),
      onAddAudioTrack: jest.fn(),
      maxVisualLayers: 3,
      maxAudioTracks: 2,
      gap: 4,
      rowHeight: 60,
      screenCount,
      isAudioMuted: false,
      screenIcon: "screen-icon.svg",
      headerActionsRef,
      ...overrides,
    }

    render(<RowHeaders {...props} />)
    return { props, headerActionsRef }
  }

  test("toggles audio mute", () => {
    const { headerActionsRef } = renderRowHeaders()

    fireEvent.mouseDown(screen.getByLabelText("Mute/unmute audio"))

    expect(headerActionsRef.current.toggleAudioMute).toHaveBeenCalledTimes(1)
  })

  test("removes a visual layer", () => {
    const { props } = renderRowHeaders()

    fireEvent.click(screen.getByLabelText("Remove layer from screen 1"))

    expect(props.onRemoveVisualLayer).toHaveBeenCalledWith(1, 1)
  })

  test("adds a visual layer", () => {
    const { props } = renderRowHeaders()

    fireEvent.click(screen.getByLabelText("Add layer to screen 2"))

    expect(props.onAddVisualLayer).toHaveBeenCalledWith(2)
  })

  test("increases the screen count", () => {
    const { headerActionsRef } = renderRowHeaders()

    fireEvent.click(screen.getByLabelText("Add screen"))

    expect(headerActionsRef.current.increaseScreenCount).toHaveBeenCalledTimes(
      1
    )
  })

  test("decreases the screen count", () => {
    const { headerActionsRef } = renderRowHeaders()

    fireEvent.click(screen.getByLabelText("Remove screen"))

    expect(headerActionsRef.current.decreaseScreenCount).toHaveBeenCalledTimes(
      1
    )
  })

  test("adds an audio track", () => {
    const { props } = renderRowHeaders()

    fireEvent.click(screen.getByLabelText("Add audio track"))

    expect(props.onAddAudioTrack).toHaveBeenCalledTimes(1)
  })
})
