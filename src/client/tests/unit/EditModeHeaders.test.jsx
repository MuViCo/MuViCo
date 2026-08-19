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

  test("mutes/unmutes label reflects an already-muted state", () => {
    renderRowHeaders({ isAudioMuted: true })

    expect(screen.getByLabelText("Mute/unmute audio")).toHaveAttribute(
      "title",
      "Unmute audio"
    )
  })

  test("shows the collapsed audio track count", () => {
    renderRowHeaders({
      rows: [
        {
          kind: "audio",
          group: "audio-collapsed",
          screen: 9,
          collapsed: true,
          groupStart: true,
          y: 0,
          count: 2,
          label: "Audio",
        },
      ],
    })

    expect(screen.getByText("2 tracks")).toBeInTheDocument()
  })

  test("treats a layer row with no layer value as the base layer", () => {
    renderRowHeaders({
      rows: [
        {
          kind: "layer",
          group: "screen-9",
          screen: 9,
          groupStart: true,
          y: 0,
          label: "L1",
        },
      ],
      screenCount: 9,
    })

    expect(
      screen.queryByLabelText("Remove layer from screen 9")
    ).not.toBeInTheDocument()
  })

  test("disables removal for a layer row flagged as non-removable", () => {
    renderRowHeaders({
      rows: [
        {
          kind: "layer",
          group: "screen-9",
          screen: 9,
          layer: 1,
          groupStart: true,
          y: 0,
          label: "L2",
          canRemoveLayer: false,
        },
      ],
      screenCount: 9,
    })

    const removeButton = screen.getByLabelText("Remove layer from screen 9")
    expect(removeButton).toHaveAttribute(
      "title",
      "Base layer cannot be removed"
    )
    expect(removeButton).toBeDisabled()
  })

  test("falls back to a default lane count for a layer row with no count metadata", () => {
    renderRowHeaders({
      rows: [
        {
          kind: "layer",
          group: "screen-9",
          screen: 9,
          layer: 0,
          groupStart: true,
          y: 0,
          label: "L1",
        },
      ],
      screenCount: 9,
    })

    expect(screen.getByLabelText("Add layer to screen 9")).toBeInTheDocument()
  })

  test("falls back to a default lane count for an audio row with no count metadata", () => {
    renderRowHeaders({
      rows: [
        {
          kind: "audio-track",
          group: "audio",
          screen: 10,
          layer: 0,
          groupStart: true,
          y: 0,
          label: "A1",
        },
      ],
    })

    expect(screen.getByLabelText("Add audio track")).not.toBeDisabled()
  })

  test("evaluates the max screen count when a full last screen still needs an add-screen control", () => {
    renderRowHeaders({
      rows: [
        {
          kind: "layer",
          group: "screen-12",
          screen: 12,
          layer: 0,
          groupStart: true,
          y: 0,
          label: "L1",
          count: 3,
          laneTotal: 3,
        },
      ],
      screenCount: 12,
    })

    expect(
      screen.queryByLabelText("Add layer to screen 12")
    ).not.toBeInTheDocument()
    expect(screen.queryByLabelText("Add screen")).not.toBeInTheDocument()
  })
})
