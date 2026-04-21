import CuesForm from "../../components/presentation/CuesForm"
import mediaStore from "../../components/presentation/mediaFileStore"
import { render, screen, fireEvent, within, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import { MemoryRouter } from "react-router-dom"

const renderCuesForm = (props = {}) => {
  const defaults = {
    addCue: jest.fn(),
    updateCue: jest.fn(),
    onClose: jest.fn(),
    cues: [],
    screenCount: 4,
    indexCount: 5,
  }

  const view = render(
    <MemoryRouter>
      <CuesForm {...defaults} {...props} />
    </MemoryRouter>
  )

  return {
    ...view,
    addCue: props.addCue || defaults.addCue,
    updateCue: props.updateCue || defaults.updateCue,
    onClose: props.onClose || defaults.onClose,
  }
}

const createDataTransfer = () => ({
  setData: jest.fn(),
})

describe("CuesForm", () => {
  beforeEach(() => {
    mediaStore.clear()
    window.localStorage.removeItem("editModeMediaPoolActiveTab")

    URL.createObjectURL = jest.fn(() => "blob:mock-url")
    URL.revokeObjectURL = jest.fn()
  })

  test("uses media tab by default when no tab preference is stored", () => {
    renderCuesForm()

    expect(screen.getByText("Upload images or videos and drag them to the grid")).toBeInTheDocument()
  })

  test("restores active tab from localStorage", () => {
    window.localStorage.setItem("editModeMediaPoolActiveTab", "audio")

    renderCuesForm()

    expect(screen.getByText("Upload audio files and drag them to the grid")).toBeInTheDocument()
  })

  test("ignores invalid stored tab values and falls back to media", () => {
    window.localStorage.setItem("editModeMediaPoolActiveTab", "invalid")

    renderCuesForm()

    expect(screen.getByText("Upload images or videos and drag them to the grid")).toBeInTheDocument()
  })

  test("renders add mode with tabs", () => {
    renderCuesForm()

    expect(screen.getByText("Add element")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Colors" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Media" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Audio" })).toBeInTheDocument()
    expect(screen.getByText("Upload images or videos and drag them to the grid")).toBeInTheDocument()
  })

  test("renders edit mode title when cue data is provided", () => {
    renderCuesForm({
      cueData: {
        _id: "cue-1",
        name: "Existing cue",
        index: 0,
        screen: 1,
        file: { name: "example.png", type: "image/png" },
      },
    })

    expect(screen.getByText("Edit Element")).toBeInTheDocument()
  })

  test("switches between tabs", () => {
    renderCuesForm()

    fireEvent.click(screen.getByRole("button", { name: "Colors" }))
    expect(screen.getByText("Select a color and drag it to the grid")).toBeInTheDocument()
    expect(screen.getByTestId("cue-name")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Audio" }))
    expect(screen.getByText("Upload audio files and drag them to the grid")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Media" }))
    expect(screen.getByText("Upload images or videos and drag them to the grid")).toBeInTheDocument()
  })

  test("persists selected tab to localStorage", () => {
    renderCuesForm()

    fireEvent.click(screen.getByRole("button", { name: "Colors" }))
    expect(window.localStorage.getItem("editModeMediaPoolActiveTab")).toBe("colors")

    fireEvent.click(screen.getByRole("button", { name: "Audio" }))
    expect(window.localStorage.getItem("editModeMediaPoolActiveTab")).toBe("audio")
  })

  test("pre-fills cue name from cueData when editing", () => {
    renderCuesForm({
      cueData: {
        _id: "cue-1",
        name: "Existing cue",
        index: 0,
        screen: 1,
        file: { name: "example.png", type: "image/png" },
      },
    })

    fireEvent.click(screen.getByRole("button", { name: "Colors" }))

    expect(screen.getByTestId("cue-name")).toHaveValue("Existing cue")
  })

  test("adds uploaded media file to media pool and can remove it", () => {
    renderCuesForm()

    const mediaInput = document.getElementById("media-upload")
    const imageFile = new File(["img"], "photo.png", { type: "image/png" })
    fireEvent.change(mediaInput, { target: { files: [imageFile] } })

    expect(screen.getByText("Media Pool (1)")).toBeInTheDocument()
    expect(screen.getByText("photo.png")).toBeInTheDocument()

    const fileNameNode = screen.getByText("photo.png")
    const fileCard = fileNameNode.closest("[draggable='true']")
    const removeButton = fileCard.querySelector("button")
    fireEvent.click(removeButton)

    expect(screen.queryByText("Media Pool (1)")).not.toBeInTheDocument()
    expect(screen.queryByText("photo.png")).not.toBeInTheDocument()
  })

  test("filters invalid files from media uploads", () => {
    renderCuesForm()

    const mediaInput = document.getElementById("media-upload")
    const imageFile = new File(["img"], "photo.png", { type: "image/png" })
    const audioFile = new File(["audio"], "sound.mp3", { type: "audio/mpeg" })
    const pdfFile = new File(["pdf"], "doc.pdf", { type: "application/pdf" })

    fireEvent.change(mediaInput, { target: { files: [imageFile, audioFile, pdfFile] } })

    expect(screen.getByText("Media Pool (1)")).toBeInTheDocument()
    expect(screen.getByText("photo.png")).toBeInTheDocument()
    expect(screen.queryByText("sound.mp3")).not.toBeInTheDocument()
    expect(screen.queryByText("doc.pdf")).not.toBeInTheDocument()
  })

  test("revokes media preview URL when media item is removed", () => {
    renderCuesForm()

    const mediaInput = document.getElementById("media-upload")
    const imageFile = new File(["img"], "photo.png", { type: "image/png" })
    fireEvent.change(mediaInput, { target: { files: [imageFile] } })

    const fileNameNode = screen.getByText("photo.png")
    const fileCard = fileNameNode.closest("[draggable='true']")
    const removeButton = fileCard.querySelector("button")
    fireEvent.click(removeButton)

    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url")
  })

  test("sets drag payload for media item and stores file", () => {
    renderCuesForm()

    const mediaInput = document.getElementById("media-upload")
    const mediaFile = new File(["img"], "clip.png", { type: "image/png" })
    fireEvent.change(mediaInput, { target: { files: [mediaFile] } })

    const fileNameNode = screen.getByText("clip.png")
    const mediaItem = fileNameNode.closest("[draggable='true']")
    const dataTransfer = createDataTransfer()

    fireEvent.dragStart(mediaItem, { dataTransfer })

    expect(dataTransfer.setData).toHaveBeenCalledWith(
      "application/json",
      expect.any(String)
    )
    const applicationJsonCall = dataTransfer.setData.mock.calls.find(
      ([mimeType]) => mimeType === "application/json"
    )
    const [, payloadString] = applicationJsonCall
    const payload = JSON.parse(payloadString)

    expect(payload.type).toBe("newCueFromForm")
    expect(payload.elementType).toBe("media")
    expect(payload.mediaId).toBeTruthy()
    expect(mediaStore.getFile(payload.mediaId)).toBe(mediaFile)
  })

  test("adds uploaded audio file to sound pool and sets drag payload", () => {
    renderCuesForm()

    fireEvent.click(screen.getByRole("button", { name: "Audio" }))

    const soundInput = document.getElementById("sound-upload")
    const audioFile = new File(["audio"], "sound.wav", { type: "audio/wav" })
    fireEvent.change(soundInput, { target: { files: [audioFile] } })

    expect(screen.getByText("Sound Pool (1)")).toBeInTheDocument()
    const soundNameNode = screen.getByText("sound.wav")
    const soundItem = soundNameNode.closest("[draggable='true']")

    const dataTransfer = createDataTransfer()
    fireEvent.dragStart(soundItem, { dataTransfer })

    expect(dataTransfer.setData).toHaveBeenCalledWith(
      "application/json",
      expect.any(String)
    )
    const applicationJsonCall = dataTransfer.setData.mock.calls.find(
      ([mimeType]) => mimeType === "application/json"
    )
    const [, payloadString] = applicationJsonCall
    const payload = JSON.parse(payloadString)

    expect(payload.type).toBe("newCueFromForm")
    expect(payload.elementType).toBe("sound")
    expect(payload.soundId).toBeTruthy()
    expect(mediaStore.getFile(payload.soundId)).toBe(audioFile)

    const removeButtons = within(soundItem).getAllByRole("button")
    fireEvent.click(removeButtons[0])
    expect(screen.queryByText("Sound Pool (1)")).not.toBeInTheDocument()
  })

  test("filters invalid files from audio uploads", () => {
    renderCuesForm()

    fireEvent.click(screen.getByRole("button", { name: "Audio" }))

    const soundInput = document.getElementById("sound-upload")
    const audioFile = new File(["audio"], "sound.wav", { type: "audio/wav" })
    const imageFile = new File(["img"], "photo.png", { type: "image/png" })

    fireEvent.change(soundInput, { target: { files: [audioFile, imageFile] } })

    expect(screen.getByText("Sound Pool (1)")).toBeInTheDocument()
    expect(screen.getByText("sound.wav")).toBeInTheDocument()
    expect(screen.queryByText("photo.png")).not.toBeInTheDocument()
  })

  test("sets drag payload for color element", () => {
    renderCuesForm()

    fireEvent.click(screen.getByRole("button", { name: "Colors" }))
    fireEvent.change(screen.getByTestId("cue-name"), { target: { value: "Warm color" } })

    const colorDragElement = screen.getByText("Drag color to grid").closest("[draggable='true']")
    const dataTransfer = createDataTransfer()

    fireEvent.dragStart(colorDragElement, { dataTransfer })

    expect(dataTransfer.setData).toHaveBeenCalledWith(
      "application/json",
      expect.any(String)
    )
    const applicationJsonCall = dataTransfer.setData.mock.calls.find(
      ([mimeType]) => mimeType === "application/json"
    )
    const [, payloadString] = applicationJsonCall
    const payload = JSON.parse(payloadString)

    expect(payload.type).toBe("newCueFromForm")
    expect(payload.elementType).toBe("color")
    expect(payload.cueName).toBe("Warm color")
    expect(payload.color).toBeTruthy()
  })

  test("submits add mode form and calls addCue with current values", () => {
    const { addCue, onClose } = renderCuesForm()

    const form = screen.getByText("Add element").closest("form")
    fireEvent.submit(form)

    expect(addCue).toHaveBeenCalledWith(
      expect.objectContaining({
        file: "",
        cueName: "",
        screen: 1,
      })
    )
    expect(onClose).toHaveBeenCalled()
  })

  test("submits edit mode form and calls updateCue", async () => {
    const updateCue = jest.fn().mockResolvedValue({})
    const onClose = jest.fn()
    renderCuesForm({
      updateCue,
      onClose,
      cueData: {
        _id: "cue-123",
        name: "Existing cue",
        index: 2,
        screen: 3,
        color: "#ffffff",
        file: {
          name: "existing.png",
          type: "image/png",
          url: "https://example.com/existing.png",
        },
      },
    })

    const form = screen.getByText("Edit Element").closest("form")
    fireEvent.submit(form)

    await waitFor(() => {
      expect(updateCue).toHaveBeenCalledWith(
        "cue-123",
        expect.objectContaining({
          cueId: "cue-123",
          cueName: "Existing cue",
          index: 2,
          screen: 3,
        })
      )
      expect(onClose).toHaveBeenCalled()
    })
  })

  test("revokes media preview URLs on unmount cleanup", () => {
    const { unmount } = renderCuesForm()

    const mediaInput = document.getElementById("media-upload")
    const firstImage = new File(["img1"], "photo1.png", { type: "image/png" })
    const secondImage = new File(["img2"], "photo2.png", { type: "image/png" })
    fireEvent.change(mediaInput, { target: { files: [firstImage, secondImage] } })

    unmount()

    expect(URL.revokeObjectURL).toHaveBeenCalled()
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2)
  })
})
