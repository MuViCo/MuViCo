/*
 * Cues form unit tests.
 * Covers tab behavior, media/audio pool rendering and upload/delete callbacks,
 * drag payloads, and form submit flows in add/edit modes.
 */
import CuesForm from "../../components/presentation/CuesForm"
import mediaStore from "../../components/presentation/mediaFileStore"
import {
  render,
  screen,
  fireEvent,
  within,
  waitFor,
} from "@testing-library/react"
import "@testing-library/jest-dom"
import { MemoryRouter } from "react-router-dom"

// A stored library entry, as GET /api/presentation/:id returns it: `url` is a
// presigned URL, not a blob:, which is why the pool survives a reload.
const mediaItem = (overrides = {}) => ({
  id: "media-1",
  name: "photo.png",
  type: "image/png",
  url: "https://example.com/media-1",
  ...overrides,
})

const renderCuesForm = (props = {}) => {
  const defaults = {
    addCue: jest.fn(),
    updateCue: jest.fn(),
    onClose: jest.fn(),
    cues: [],
    screenCount: 4,
    indexCount: 5,
    mediaLibrary: [],
    onUploadMedia: jest.fn().mockResolvedValue(undefined),
    onDeleteMedia: jest.fn().mockResolvedValue(undefined),
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
    onUploadMedia: props.onUploadMedia || defaults.onUploadMedia,
    onDeleteMedia: props.onDeleteMedia || defaults.onDeleteMedia,
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

    expect(
      screen.getByText("Upload images or videos and drag them to the grid")
    ).toBeInTheDocument()
  })

  test("restores active tab from localStorage", () => {
    window.localStorage.setItem("editModeMediaPoolActiveTab", "audio")

    renderCuesForm()

    expect(
      screen.getByText("Upload audio files and drag them to the grid")
    ).toBeInTheDocument()
  })

  test("ignores invalid stored tab values and falls back to media", () => {
    window.localStorage.setItem("editModeMediaPoolActiveTab", "invalid")

    renderCuesForm()

    expect(
      screen.getByText("Upload images or videos and drag them to the grid")
    ).toBeInTheDocument()
  })

  test("renders add mode with tabs", () => {
    renderCuesForm()

    expect(screen.getByText("Add element")).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Colors" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Media" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Audio" })).toBeInTheDocument()
    expect(
      screen.getByText("Upload images or videos and drag them to the grid")
    ).toBeInTheDocument()
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

    expect(screen.getByText("Edit element")).toBeInTheDocument()
  })

  test("switches between tabs", () => {
    renderCuesForm()

    fireEvent.click(screen.getByRole("tab", { name: "Colors" }))
    expect(
      screen.getByText("Select a color and drag it to the grid")
    ).toBeInTheDocument()
    expect(screen.getByTestId("cue-name")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("tab", { name: "Audio" }))
    expect(
      screen.getByText("Upload audio files and drag them to the grid")
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole("tab", { name: "Media" }))
    expect(
      screen.getByText("Upload images or videos and drag them to the grid")
    ).toBeInTheDocument()
  })

  test("persists selected tab to localStorage", () => {
    renderCuesForm()

    fireEvent.click(screen.getByRole("tab", { name: "Colors" }))
    expect(window.localStorage.getItem("editModeMediaPoolActiveTab")).toBe(
      "colors"
    )

    fireEvent.click(screen.getByRole("tab", { name: "Audio" }))
    expect(window.localStorage.getItem("editModeMediaPoolActiveTab")).toBe(
      "audio"
    )
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

    fireEvent.click(screen.getByRole("tab", { name: "Colors" }))

    expect(screen.getByTestId("cue-name")).toHaveValue("Existing cue")
  })

  test("renders the stored media library as the media pool", () => {
    renderCuesForm({ mediaLibrary: [mediaItem()] })

    expect(screen.getByText("Media Pool (1)")).toBeInTheDocument()
    expect(screen.getByText("photo.png")).toBeInTheDocument()
    expect(screen.getByAltText("photo.png")).toHaveAttribute(
      "src",
      "https://example.com/media-1"
    )
  })

  test("uploads picked media to the library instead of keeping it in memory", async () => {
    const { onUploadMedia } = renderCuesForm()

    const mediaInput = document.getElementById("media-upload")
    const imageFile = new File(["img"], "photo.png", { type: "image/png" })
    fireEvent.change(mediaInput, { target: { files: [imageFile] } })

    await waitFor(() => {
      expect(onUploadMedia).toHaveBeenCalledWith(imageFile)
    })
  })

  test("filters invalid files from media uploads", async () => {
    const { onUploadMedia } = renderCuesForm()

    const mediaInput = document.getElementById("media-upload")
    const imageFile = new File(["img"], "photo.png", { type: "image/png" })
    const audioFile = new File(["audio"], "sound.mp3", { type: "audio/mpeg" })
    const pdfFile = new File(["pdf"], "doc.pdf", { type: "application/pdf" })

    fireEvent.change(mediaInput, {
      target: { files: [imageFile, audioFile, pdfFile] },
    })

    await waitFor(() => {
      expect(onUploadMedia).toHaveBeenCalledTimes(1)
    })
    expect(onUploadMedia).toHaveBeenCalledWith(imageFile)
  })

  test("removing a pool item asks for confirmation before deleting", async () => {
    const { onDeleteMedia } = renderCuesForm({ mediaLibrary: [mediaItem()] })

    const fileCard = screen.getByText("photo.png").closest("[draggable='true']")
    fireEvent.click(fileCard.querySelector("button"))

    // The delete is permanent, so nothing happens until it is confirmed.
    expect(
      await screen.findByText("Delete media permanently?")
    ).toBeInTheDocument()
    expect(onDeleteMedia).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole("button", { name: "Delete" }))

    await waitFor(() => {
      expect(onDeleteMedia).toHaveBeenCalledWith("media-1")
    })
  })

  test("cancelling the confirmation leaves the entry alone", async () => {
    const { onDeleteMedia } = renderCuesForm({ mediaLibrary: [mediaItem()] })

    const fileCard = screen.getByText("photo.png").closest("[draggable='true']")
    fireEvent.click(fileCard.querySelector("button"))

    fireEvent.click(await screen.findByRole("button", { name: "Cancel" }))

    await waitFor(() => {
      expect(screen.queryByText("Delete media permanently?")).toBeNull()
    })
    expect(onDeleteMedia).not.toHaveBeenCalled()
  })

  test("warns how many timeline elements the deletion will take with it", async () => {
    renderCuesForm({
      mediaLibrary: [mediaItem()],
      cues: [
        { _id: "cue-1", file: { id: "media-1" } },
        { _id: "cue-2", file: { id: "media-1" } },
        { _id: "cue-3", file: { id: "other" } },
      ],
    })

    const fileCard = screen.getByText("photo.png").closest("[draggable='true']")
    fireEvent.click(fileCard.querySelector("button"))

    expect(
      await screen.findByText(
        "2 elements on the timeline use it and will be deleted too."
      )
    ).toBeInTheDocument()
  })

  test("drag payload carries the stored media id, not an in-memory file", () => {
    renderCuesForm({
      mediaLibrary: [mediaItem({ id: "media-9", name: "clip.png" })],
    })

    const card = screen.getByText("clip.png").closest("[draggable='true']")
    const dataTransfer = createDataTransfer()

    fireEvent.dragStart(card, { dataTransfer })

    const applicationJsonCall = dataTransfer.setData.mock.calls.find(
      ([mimeType]) => mimeType === "application/json"
    )
    const payload = JSON.parse(applicationJsonCall[1])

    expect(payload.type).toBe("newCueFromForm")
    expect(payload.elementType).toBe("media")
    expect(payload.mediaId).toBe("media-9")
    expect(payload.previewUrl).toBe("https://example.com/media-1")
    // Nothing is put in mediaStore any more: the bytes are already on the
    // server, so the drop handler only needs the id.
    expect(mediaStore.getFile("media-9")).toBeUndefined()
  })

  test("splits the library by MIME type: audio entries land in the sound pool", async () => {
    const { onDeleteMedia } = renderCuesForm({
      mediaLibrary: [
        mediaItem(),
        mediaItem({ id: "media-2", name: "sound.wav", type: "audio/wav" }),
      ],
    })

    // The image is in the media pool, not here.
    expect(screen.getByText("Media Pool (1)")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("tab", { name: "Audio" }))

    expect(screen.getByText("Sound Pool (1)")).toBeInTheDocument()
    const soundItem = screen
      .getByText("sound.wav")
      .closest("[draggable='true']")

    const dataTransfer = createDataTransfer()
    fireEvent.dragStart(soundItem, { dataTransfer })

    const applicationJsonCall = dataTransfer.setData.mock.calls.find(
      ([mimeType]) => mimeType === "application/json"
    )
    const payload = JSON.parse(applicationJsonCall[1])

    expect(payload.type).toBe("newCueFromForm")
    expect(payload.elementType).toBe("sound")
    expect(payload.soundId).toBe("media-2")

    const removeButtons = within(soundItem).getAllByRole("button")
    fireEvent.click(removeButtons[0])
    fireEvent.click(await screen.findByRole("button", { name: "Delete" }))

    await waitFor(() => {
      expect(onDeleteMedia).toHaveBeenCalledWith("media-2")
    })
  })

  test("filters invalid files from audio uploads", async () => {
    const { onUploadMedia } = renderCuesForm()

    fireEvent.click(screen.getByRole("tab", { name: "Audio" }))

    const soundInput = document.getElementById("sound-upload")
    const audioFile = new File(["audio"], "sound.wav", { type: "audio/wav" })
    const imageFile = new File(["img"], "photo.png", { type: "image/png" })

    fireEvent.change(soundInput, { target: { files: [audioFile, imageFile] } })

    await waitFor(() => {
      expect(onUploadMedia).toHaveBeenCalledTimes(1)
    })
    expect(onUploadMedia).toHaveBeenCalledWith(audioFile)
  })

  test("sets drag payload for color element", () => {
    renderCuesForm()

    fireEvent.click(screen.getByRole("tab", { name: "Colors" }))
    fireEvent.change(screen.getByTestId("cue-name"), {
      target: { value: "Warm color" },
    })

    const colorDragElement = screen
      .getByText("Drag to grid")
      .closest("[draggable='true']")
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
        file: null,
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

    const form = screen.getByText("Edit element").closest("form")
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
})
