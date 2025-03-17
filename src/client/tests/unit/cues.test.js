import CuesForm from "../../components/presentation/CuesForm"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import React from "react"
import { MemoryRouter } from "react-router-dom"

describe("CuesForm new element", () => {
  test("render form elements", () => {
    render(
      <MemoryRouter>
        <CuesForm />
      </MemoryRouter>
    )
    expect(screen.getByText("Add element")).toBeInTheDocument()
    expect(screen.getByText("Index 0-100*")).toBeInTheDocument()
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
      fileName: "",
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

  test("upload invalid filetype", async () => {
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
    const test_file = new File([""], "invalidfile.pdf", {
      type: "application/pdf",
    })
    fireEvent.change(fileInput, { target: { files: [test_file] } })

    const submitButton = screen.getByText("Submit")
    fireEvent.click(submitButton)

    expect(addCue).not.toHaveBeenCalledWith({
      file: "/blank.png",
      index: 3,
      cueName: "test cue",
      screen: 2,
      fileName: "blank.png",
    })
    expect(onClose).not.toHaveBeenCalled()

    expect(
      screen.queryByText(
        "Invalid file type. Please see the info button for valid types."
      )
    ).toBeInTheDocument()

    await waitFor(
      () => {
        expect(
          screen.queryByText(
            "Invalid file type. Please see the info button for valid types."
          )
        ).not.toBeInTheDocument()
      },
      { timeout: 6000 }
    )
  }, 10000)
})

describe("CuesForm update element", () => {
  test("render form elements with existing elements", async () => {
    const addCue = jest.fn()
    const onClose = jest.fn()
    const updateCue = jest.fn()
    const cueData = {
      file: { url: "http://example.com/image1.jpg", name: "image1.jpg" },
      index: 0,
      name: "testtt",
      screen: 1,
      _id: "123456789",
    }
    const mockCues = []

    render(
      <MemoryRouter>
        <CuesForm
          addCue={addCue}
          updateCue={updateCue}
          onClose={onClose}
          cues={mockCues}
          cueData={cueData}
        />
      </MemoryRouter>
    )

    expect(
      screen.getByTestId("cue-name", { target: { value: "testtt" } })
    ).toBeInTheDocument()
    expect(
      screen.getByTestId("screen-number", { target: { value: "1" } })
    ).toBeInTheDocument()
    expect(
      screen.getByTestId("index-number", { target: { value: "0" } })
    ).toBeInTheDocument()
    expect(
      screen.getByTestId("file-name", {
        target: { url: "http://example.com/image1.jpg", name: "image1.jpg" },
      })
    ).toBeInTheDocument()
    expect(screen.getByText("image1.jpg")).toBeInTheDocument()
  })

  test("update cues form with blank element", async () => {
    const onClose = jest.fn()
    const updateCue = jest.fn()
    const cueData = {
      file: { url: "http://example.com/image1.jpg", name: "image1.jpg" },
      index: 0,
      name: "testtt",
      screen: 1,
      _id: "123456789",
    }
    const mockCues = []

    render(
      <MemoryRouter>
        <CuesForm
          updateCue={updateCue}
          cues={mockCues}
          cueData={cueData}
          onClose={onClose}
        />
      </MemoryRouter>
    )

    const screenInput = screen.getByTestId("screen-number")
    fireEvent.change(screenInput, { target: { value: "2" } })

    const indexInput = screen.getByTestId("index-number")
    fireEvent.change(indexInput, { target: { value: "1" } })

    const nameInput = screen.getByTestId("cue-name")
    fireEvent.change(nameInput, { target: { value: "updated_testtt" } })

    const blankElement = screen.getByText("Add blank")
    fireEvent.click(blankElement)

    const submitButton = screen.getByText("Submit")
    fireEvent.click(submitButton)

    expect(updateCue).toHaveBeenCalledWith("123456789", {
      cueId: "123456789",
      cueName: "updated_testtt",
      index: 1,
      screen: 2,
      file: "/blank.png",
      fileName: "blank.png",
    })
    await waitFor(
      () => {
        expect(onClose).toHaveBeenCalled()
      },
      { timeout: 2000 }
    )
  }, 3000)

  test("update element with invalid filetype", async () => {
    const onClose = jest.fn()
    const updateCue = jest.fn()
    const cueData = {
      file: { url: "http://example.com/image1.jpg", name: "image1.jpg" },
      index: 0,
      name: "testtt",
      screen: 1,
      _id: "123456789",
    }
    const mockCues = []

    render(
      <MemoryRouter>
        <CuesForm
          updateCue={updateCue}
          cues={mockCues}
          cueData={cueData}
          onClose={onClose}
        />
      </MemoryRouter>
    )

    const fileInput = screen.getByLabelText("Upload media")
    const test_file = new File([""], "invalidfile.pdf", {
      type: "application/pdf",
    })
    fireEvent.change(fileInput, { target: { files: [test_file] } })

    const submitButton = screen.getByText("Submit")
    fireEvent.click(submitButton)

    expect(updateCue).not.toHaveBeenCalledWith("123456789", {
      cueId: "123456789",
      file: "/invalidfile.pdf",
      index: 0,
      cueName: "testtt",
      screen: 1,
    })
    expect(onClose).not.toHaveBeenCalled()

    expect(
      screen.queryByText(
        "Invalid file type. Please see the info button for valid types."
      )
    ).toBeInTheDocument()
  })
})
