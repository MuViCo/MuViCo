import CuesForm from "../../components/presentation/CuesForm"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import React from "react"
import { MemoryRouter } from "react-router-dom"

describe("CuesForm", () => {
  test("render form elements", () => {
    render(
      <MemoryRouter>
        <CuesForm />
      </MemoryRouter>
    )
    expect(screen.getByText("Add element")).toBeInTheDocument()
    expect(screen.getByText("Index 1-100*")).toBeInTheDocument()
    expect(screen.getByText("Name*")).toBeInTheDocument()
    expect(screen.getByText("Screen 1-4*")).toBeInTheDocument()
    expect(screen.getAllByText("Upload media")).toHaveLength(2)
    expect(screen.getByText("or add blank element")).toBeInTheDocument()
    expect(screen.getByText("Add blank")).toBeInTheDocument()
    expect(screen.getByText("Submit")).toBeInTheDocument()
  })

  test("add cues form with blank element", async () => {
    const addCue = jest.fn()
    const onClose = jest.fn()
    const mockCues = []

    render(
      <MemoryRouter>
        <CuesForm addCue={addCue} onClose={onClose} cues={mockCues} />
      </MemoryRouter>
    )

    const cueNameInput = screen.getByTestId("cue-name")
    fireEvent.change(cueNameInput, { target: { value: "test cue" } })

    const screenInput = screen.getByTestId("screen-number")
    fireEvent.change(screenInput, { target: { value: "2" } })

    const indexInput = screen.getByTestId("index-number")
    fireEvent.change(indexInput, { target: { value: "5" } })

    const blankElement = screen.getByText("or add blank element")
    fireEvent.click(blankElement)

    const submitButton = screen.getByText("Submit")
    fireEvent.click(submitButton)

    expect(addCue).toHaveBeenCalledWith({
      file: "/blank.png",
      index: 5,
      cueName: "test cue",
      screen: 2,
      fileName: "blank.png",
    })
    expect(onClose).toHaveBeenCalled()
  })

  test("add cues form with a file", async () => {
    const addCue = jest.fn()
    const onClose = jest.fn()
    const mockCues = []

    render(
      <MemoryRouter>
        <CuesForm addCue={addCue} onClose={onClose} cues={mockCues} />
      </MemoryRouter>
    )

    const cueNameInput = screen.getByTestId("cue-name")
    fireEvent.change(cueNameInput, { target: { value: "test cue" } })

    const screenInput = screen.getByTestId("screen-number")
    fireEvent.change(screenInput, { target: { value: "2" } })

    const indexInput = screen.getByTestId("index-number")
    fireEvent.change(indexInput, { target: { value: "4" } })

    const fileInput = screen.getByLabelText("Upload media")
    const file = new File([""], "testfile.png", { type: "image/png" })
    fireEvent.change(fileInput, { target: { files: [file] } })

    const submitButton = screen.getByText("Submit")
    fireEvent.click(submitButton)

    expect(addCue).toHaveBeenCalledWith({
      file: file,
      index: 4,
      cueName: "test cue",
      screen: 2,
      fileName: "testfile.png",
    })
    expect(onClose).toHaveBeenCalled()
  })

  test("add cues with a blank instead of file if error occurs", async () => {
    const addCue = jest.fn()
    const onClose = jest.fn()
    const mockCues = []

    render(
      <MemoryRouter>
        <CuesForm addCue={addCue} onClose={onClose} cues={mockCues} />
      </MemoryRouter>
    )

    const cueNameInput = screen.getByTestId("cue-name")
    fireEvent.change(cueNameInput, { target: { value: "test cue" } })

    const screenInput = screen.getByTestId("screen-number")
    fireEvent.change(screenInput, { target: { value: "2" } })

    const indexInput = screen.getByTestId("index-number")
    fireEvent.change(indexInput, { target: { value: "3" } })

    const fileInput = screen.getByLabelText("Upload media")
    fireEvent.change(fileInput, { target: { files: [] } })

    const submitButton = screen.getByText("Submit")
    fireEvent.click(submitButton)

    expect(addCue).toHaveBeenCalledWith({
      file: "/blank.png",
      index: 3,
      cueName: "test cue",
      screen: 2,
      fileName: "blank.png",
    })
    expect(onClose).toHaveBeenCalled()
  })
})
