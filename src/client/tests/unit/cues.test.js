import CuesForm from "../../components/presentation/CuesForm"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import { MemoryRouter } from "react-router-dom"

const renderVisualForm = (props = {}) => {
  const defaults = {
    addCue: jest.fn(),
    onClose: jest.fn(),
    cues: [],
    screenCount: 4,
    indexCount: 5,
  }

  render(
    <MemoryRouter>
      <CuesForm {...defaults} {...props} />
    </MemoryRouter>
  )

  return {
    addCue: props.addCue || defaults.addCue,
    onClose: props.onClose || defaults.onClose,
  }
}

const getColorSwatches = () => document.querySelectorAll(".picker__swatch")

describe("CuesForm new element", () => {
  test("renders core form elements with colorpicker", () => {
    renderVisualForm()

    expect(screen.getByText("Add element")).toBeInTheDocument()
    expect(screen.getByText(/Frame\s*0-4/i)).toBeInTheDocument()
    expect(screen.getByText("Name*")).toBeInTheDocument()
    expect(screen.getAllByText("Upload media").length).toBeGreaterThan(0)
    expect(document.querySelector(".picker")).toBeInTheDocument()

    const swatches = getColorSwatches()
    expect(swatches.length).toBeGreaterThan(0)
  })

  test("add cue with uploaded visual file", async () => {
    const addCue = jest.fn()
    const onClose = jest.fn()

    renderVisualForm({ addCue, onClose })

    fireEvent.change(screen.getByTestId("cue-name"), { target: { value: "test cue" } })
    fireEvent.change(screen.getByTestId("screen-number"), { target: { value: "2" } })
    fireEvent.change(screen.getByTestId("index-number"), { target: { value: "4" } })

    const fileInput = screen.getByLabelText("Upload media")
    const file = new File([""], "testfile.png", { type: "image/png" })
    fireEvent.change(fileInput, { target: { files: [file] } })

    fireEvent.click(screen.getByText("Submit"))

    expect(addCue).toHaveBeenCalledWith({
      file,
      index: 0,
      cueName: "test cue",
      screen: 2,
      fileName: "testfile.png",
      color: undefined,
      loop: false,
    })
    expect(onClose).toHaveBeenCalled()
  })

  test("add cue keeps selected color when uploading a file", async () => {
    const addCue = jest.fn()

    renderVisualForm({ addCue })

    fireEvent.change(screen.getByTestId("cue-name"), { target: { value: "file and color cue" } })
    fireEvent.change(screen.getByTestId("screen-number"), { target: { value: "2" } })

    const swatches = getColorSwatches()
    fireEvent.click(swatches[5])

    const fileInput = screen.getByLabelText("Upload media")
    const file = new File([""], "colorfile.png", { type: "image/png" })
    fireEvent.change(fileInput, { target: { files: [file] } })

    fireEvent.click(screen.getByText("Submit"))

    expect(addCue).toHaveBeenCalledWith(
      expect.objectContaining({
        file,
        fileName: "colorfile.png",
        color: "#ff0000",
      })
    )
  })

  test("add cue with selected color from colorpicker swatch", async () => {
    const addCue = jest.fn()
    const onClose = jest.fn()

    renderVisualForm({ addCue, onClose })

    fireEvent.change(screen.getByTestId("cue-name"), { target: { value: "color cue" } })
    fireEvent.change(screen.getByTestId("screen-number"), { target: { value: "2" } })
    fireEvent.change(screen.getByTestId("index-number"), { target: { value: "1" } })

    const swatches = getColorSwatches()
    fireEvent.click(swatches[4])

    fireEvent.click(screen.getByText("Submit"))

    expect(addCue).toHaveBeenCalledWith({
      file: "",
      index: 0,
      cueName: "color cue",
      screen: 2,
      fileName: "",
      color: "#9142ff",
      loop: false,
    })
    expect(onClose).toHaveBeenCalled()
  })

  test("add cue with selected preset swatch color", async () => {
    const addCue = jest.fn()

    renderVisualForm({ addCue })

    fireEvent.change(screen.getByTestId("cue-name"), { target: { value: "preset color cue" } })
    fireEvent.change(screen.getByTestId("screen-number"), { target: { value: "3" } })

    const swatches = getColorSwatches()
    fireEvent.click(swatches[4])

    fireEvent.click(screen.getByText("Submit"))

    expect(addCue).toHaveBeenCalledWith(
      expect.objectContaining({
        file: "",
        cueName: "preset color cue",
        screen: 3,
        color: "#9142ff",
      })
    )
  })

  test("upload invalid visual filetype", async () => {
    const addCue = jest.fn()
    const onClose = jest.fn()

    renderVisualForm({ addCue, onClose })

    fireEvent.change(screen.getByTestId("cue-name"), { target: { value: "test cue" } })
    fireEvent.change(screen.getByTestId("screen-number"), { target: { value: "2" } })

    const fileInput = screen.getByLabelText("Upload media")
    const testFile = new File([""], "invalidfile.pdf", { type: "application/pdf" })
    fireEvent.change(fileInput, { target: { files: [testFile] } })

    fireEvent.click(screen.getByText("Submit"))

    expect(addCue).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()

    expect(
      screen.queryByText(
        "Invalid file type. Please see the info button for valid visual file types."
      )
    ).toBeInTheDocument()

    await waitFor(
      () => {
        expect(
          screen.queryByText(
            "Invalid file type. Please see the info button for valid visual file types."
          )
        ).not.toBeInTheDocument()
      },
      { timeout: 6000 }
    )
  }, 10000)

  test("upload audio file automatically assigns to audio screen", async () => {
    const addCue = jest.fn()
    const onClose = jest.fn()

    renderVisualForm({ addCue, onClose })

    fireEvent.change(screen.getByTestId("cue-name"), { target: { value: "test audio cue" } })
    fireEvent.change(screen.getByTestId("index-number"), { target: { value: "2" } })

    const fileInput = screen.getByLabelText("Upload media")
    const audioFile = new File([""], "test.mp3", { type: "audio/mpeg" })
    fireEvent.change(fileInput, { target: { files: [audioFile] } })

    fireEvent.click(screen.getByText("Submit"))

    expect(addCue).toHaveBeenCalledWith({
      file: audioFile,
      index: 0,
      cueName: "test audio cue",
      screen: 5,
      fileName: "test.mp3",
      color: undefined,
      loop: false,
    })
    expect(onClose).toHaveBeenCalled()
  })

  test("upload invalid audio type to audio screen", async () => {
    const addCue = jest.fn()
    const onClose = jest.fn()

    renderVisualForm({ addCue, onClose })

    fireEvent.change(screen.getByTestId("cue-name"), { target: { value: "test cue" } })
    fireEvent.change(screen.getByTestId("screen-number"), { target: { value: "5" } })

    const fileInput = screen.getByLabelText("Upload media")
    const invalidAudioFile = new File([""], "test.flac", { type: "audio/flac" })
    fireEvent.change(fileInput, { target: { files: [invalidAudioFile] } })

    fireEvent.click(screen.getByText("Submit"))

    expect(addCue).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
    expect(
      screen.queryByText(
        "Invalid file type. Only audio files (.mp3, .wav) are allowed on the audio screen."
      )
    ).toBeInTheDocument()
  })

  test("submitting empty audio cue shows validation error", async () => {
    const addCue = jest.fn()
    const onClose = jest.fn()

    renderVisualForm({ addCue, onClose })

    fireEvent.change(screen.getByTestId("cue-name"), { target: { value: "test cue" } })
    fireEvent.change(screen.getByTestId("screen-number"), { target: { value: "5" } })

    fireEvent.click(screen.getByText("Submit"))

    expect(addCue).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.queryByText("Please select a valid audio file for the audio cue")).toBeInTheDocument()
  })

  test("upload file automatically updates untouched element name", async () => {
    const addCue = jest.fn()

    renderVisualForm({ addCue })

    fireEvent.change(screen.getByTestId("screen-number"), { target: { value: "3" } })
    fireEvent.change(screen.getByTestId("index-number"), { target: { value: "2" } })

    const fileInput = screen.getByLabelText("Upload media")
    const file = new File([""], "testfile.png", { type: "image/png" })
    fireEvent.change(fileInput, { target: { files: [file] } })

    fireEvent.click(screen.getByText("Submit"))

    expect(addCue).toHaveBeenCalledWith({
      file,
      index: 0,
      cueName: "testfile.png",
      screen: 3,
      fileName: "testfile.png",
      color: undefined,
      loop: false,
    })
  })

  test("upload file does not change custom element name", async () => {
    const addCue = jest.fn()

    renderVisualForm({ addCue })

    fireEvent.change(screen.getByTestId("cue-name"), { target: { value: "test cue" } })
    fireEvent.change(screen.getByTestId("screen-number"), { target: { value: "3" } })

    const fileInput = screen.getByLabelText("Upload media")
    const file = new File([""], "testfile.png", { type: "image/png" })
    fireEvent.change(fileInput, { target: { files: [file] } })

    fireEvent.click(screen.getByText("Submit"))

    expect(addCue).toHaveBeenCalledWith({
      file,
      index: 0,
      cueName: "test cue",
      screen: 3,
      fileName: "testfile.png",
      color: undefined,
      loop: false,
    })
  })

  test("uploading another file replaces previous file name", async () => {
    renderVisualForm()

    const fileInput = screen.getByLabelText("Upload media")
    const file = new File([""], "testfile.png", { type: "image/png" })
    fireEvent.change(fileInput, { target: { files: [file] } })
    expect(screen.queryByText("testfile.png")).toBeInTheDocument()

    const file2 = new File([""], "testfile2.png", { type: "image/png" })
    fireEvent.change(fileInput, { target: { files: [file2] } })

    expect(screen.queryByText("testfile2.png")).toBeInTheDocument()
    expect(screen.queryByText("testfile.png")).not.toBeInTheDocument()
  })

  test("form defaults include blank cue name and empty color", async () => {
    renderVisualForm()

    const cueNameInput = screen.getByTestId("cue-name")
    expect(cueNameInput.value).toBe("Blank")

    expect(document.querySelector(".picker")).toBeInTheDocument()
  })

  test("form defaults to empty cue name when in audio mode", async () => {
    const addAudioCue = jest.fn()
    const onClose = jest.fn()
    const mockAudioCues = []

    render(
      <MemoryRouter>
        <CuesForm
          addAudioCue={addAudioCue}
          onClose={onClose}
          audioCues={mockAudioCues}
          screenCount={4}
          indexCount={5}
          isAudioMode={true}
        />
      </MemoryRouter>
    )

    const cueNameInput = screen.getByTestId("cue-name")
    expect(cueNameInput.value).toBe("")

    expect(document.querySelector(".picker")).toBeInTheDocument()
  })

  test("editing existing element preserves existing file and name", async () => {
    const updateCue = jest.fn()
    const onClose = jest.fn()
    const cueData = {
      file: { url: "http://example.com/image1.jpg", name: "image1.jpg" },
      index: 0,
      name: "existing element",
      screen: 1,
      _id: "123456789",
    }

    renderVisualForm({ updateCue, cueData, onClose })

    const cueNameInput = screen.getByTestId("cue-name")
    expect(cueNameInput.value).toBe("existing element")
    expect(screen.getByText("image1.jpg")).toBeInTheDocument()
  })
})

describe("CuesForm update element", () => {
  test("render form elements with existing cue", async () => {
    const updateCue = jest.fn()
    const cueData = {
      file: { url: "http://example.com/image1.jpg", name: "image1.jpg" },
      index: 0,
      name: "testtt",
      screen: 1,
      _id: "123456789",
    }

    renderVisualForm({ updateCue, cueData })

    expect(screen.getByTestId("cue-name", { target: { value: "testtt" } })).toBeInTheDocument()
    expect(screen.getByTestId("screen-number", { target: { value: "1" } })).toBeInTheDocument()
    expect(screen.getByTestId("index-number", { target: { value: "0" } })).toBeInTheDocument()
    expect(screen.getByText("image1.jpg")).toBeInTheDocument()
  })

  test("update cue with selected color", async () => {
    const onClose = jest.fn()
    const updateCue = jest.fn()
    const cueData = {
      file: { url: "http://example.com/image1.jpg", name: "image1.jpg" },
      index: 0,
      name: "testtt",
      screen: 1,
      _id: "123456789",
    }

    renderVisualForm({ updateCue, cueData, onClose })

    fireEvent.change(screen.getByTestId("screen-number"), { target: { value: "2" } })
    fireEvent.change(screen.getByTestId("index-number"), { target: { value: "1" } })
    fireEvent.change(screen.getByTestId("cue-name"), { target: { value: "updated_testtt" } })

    const swatches = getColorSwatches()
    fireEvent.click(swatches[11])

    fireEvent.click(screen.getByText("Submit"))

    expect(updateCue).toHaveBeenCalledWith("123456789", {
      cueId: "123456789",
      cueName: "updated_testtt",
      index: 1,
      screen: 2,
      color: "#ff69b4",
      file: { url: "http://example.com/image1.jpg", name: "image1.jpg" },
      fileName: "image1.jpg",
    })

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })
  })

  test("update cue keeps existing color when user does not change it", async () => {
    const updateCue = jest.fn()
    const cueData = {
      file: { url: "http://example.com/image1.jpg", name: "image1.jpg" },
      index: 0,
      name: "testtt",
      screen: 1,
      color: "#4b0082",
      _id: "123456789",
    }

    renderVisualForm({ updateCue, cueData })

    fireEvent.click(screen.getByText("Submit"))

    expect(updateCue).toHaveBeenCalledWith(
      "123456789",
      expect.objectContaining({
        cueId: "123456789",
        cueName: "testtt",
        screen: 1,
        color: "#4b0082",
      })
    )
  })

  test("update cue with invalid filetype shows visual error", async () => {
    const onClose = jest.fn()
    const updateCue = jest.fn()
    const cueData = {
      file: { url: "http://example.com/image1.jpg", name: "image1.jpg" },
      index: 0,
      name: "testtt",
      screen: 1,
      _id: "123456789",
    }

    renderVisualForm({ updateCue, cueData, onClose })

    const fileInput = screen.getByLabelText("Upload media")
    const testFile = new File([""], "invalidfile.pdf", { type: "application/pdf" })
    fireEvent.change(fileInput, { target: { files: [testFile] } })

    fireEvent.click(screen.getByText("Submit"))

    expect(updateCue).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
    expect(
      screen.queryByText(
        "Invalid file type. Please see the info button for valid visual file types."
      )
    ).toBeInTheDocument()
  })
})
