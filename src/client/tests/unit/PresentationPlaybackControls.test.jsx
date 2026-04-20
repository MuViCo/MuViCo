import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom"
import PresentationPlaybackControls from "../../components/presentation/PresentationPlaybackControls"

const renderControls = (overrideProps = {}) => {
  const props = {
    screens: { 1: false, 2: false },
    toggleAllScreens: jest.fn(),
    cueIndex: 0,
    updateCue: jest.fn(),
    indexCount: 10,
    autoplayInterval: 5,
    toggleAutoplay: jest.fn(),
    isAutoplaying: false,
    toggleAutoplayInterval: jest.fn(),
    ...overrideProps,
  }

  const view = render(<PresentationPlaybackControls {...props} />)
  return { ...view, props }
}

describe("PresentationPlaybackControls", () => {
  test("shows Frame 0 at cueIndex 0", () => {
    renderControls({ cueIndex: 0 })

    expect(screen.getByRole("heading", { name: "Frame 0" })).toBeInTheDocument()
  })

  test("shows Frame N when cueIndex is greater than 0", () => {
    renderControls({ cueIndex: 4 })

    expect(screen.getByRole("heading", { name: "Frame 4" })).toBeInTheDocument()
  })

  test("calls updateCue for previous and next buttons", () => {
    const updateCue = jest.fn()
    renderControls({ cueIndex: 1, updateCue, indexCount: 5 })

    fireEvent.click(screen.getByRole("button", { name: "Previous Cue" }))
    fireEvent.click(screen.getByRole("button", { name: "Next Cue" }))

    expect(updateCue).toHaveBeenNthCalledWith(1, "Previous")
    expect(updateCue).toHaveBeenNthCalledWith(2, "Next")
  })

  test("disables previous button at first frame", () => {
    renderControls({ cueIndex: 0 })

    expect(screen.getByRole("button", { name: "Previous Cue" })).toBeDisabled()
  })

  test("disables next button at last frame", () => {
    renderControls({ cueIndex: 9, indexCount: 10 })

    expect(screen.getByRole("button", { name: "Next Cue" })).toBeDisabled()
  })

  test("renders Open all screens when all screens are closed", () => {
    renderControls({ screens: { 1: false, 2: false } })

    expect(screen.getByRole("button", { name: "Open all screens" })).toBeInTheDocument()
  })

  test("renders Close all screens when at least one screen is open", () => {
    renderControls({ screens: { 1: true, 2: false } })

    expect(screen.getByRole("button", { name: "Close all screens" })).toBeInTheDocument()
  })

  test("calls toggleAllScreens when the all screens button is clicked", () => {
    const toggleAllScreens = jest.fn()
    renderControls({ toggleAllScreens })

    fireEvent.click(screen.getByRole("button", { name: "Open all screens" }))

    expect(toggleAllScreens).toHaveBeenCalledTimes(1)
  })

  test("calls toggleAutoplay from autoplay button", () => {
    const toggleAutoplay = jest.fn()
    renderControls({ toggleAutoplay, isAutoplaying: false })

    fireEvent.click(screen.getByRole("button", { name: "Start Autoplay" }))

    expect(toggleAutoplay).toHaveBeenCalledTimes(1)
  })

  test("shows Stop Autoplay when autoplay is active", () => {
    renderControls({ isAutoplaying: true })

    expect(screen.getByRole("button", { name: "Stop Autoplay" })).toBeInTheDocument()
  })

  test("calls toggleAutoplayInterval on interval input changes", () => {
    const toggleAutoplayInterval = jest.fn()
    renderControls({ toggleAutoplayInterval, autoplayInterval: 5 })

    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "0.5" } })

    expect(toggleAutoplayInterval).toHaveBeenCalled()
  })
})
