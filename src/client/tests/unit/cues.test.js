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

// The delete button only exists while the tile is hovered.
const clickRemoveOn = (name) => {
  const tile = screen.getByText(name).closest("[draggable='true']")
  fireEvent.mouseEnter(tile)
  fireEvent.click(within(tile).getByRole("button", { name: `Remove ${name}` }))
  return tile
}

describe("CuesForm", () => {
  beforeEach(() => {
    mediaStore.clear()
    window.localStorage.removeItem("editModeMediaPoolActiveTab")

    URL.createObjectURL = jest.fn(() => "blob:mock-url")
    URL.revokeObjectURL = jest.fn()
  })

  test("shows the media section by default, with no heading above it", () => {
    renderCuesForm()

    expect(screen.getByRole("button", { name: "Upload media" })).toBeVisible()
    // The tab strip and the "Add element" heading both moved out: EditorDock
    // owns the one row of tabs, and the search bar took the heading's place.
    expect(screen.queryByRole("tab")).toBeNull()
    expect(screen.queryByText("Add element")).toBeNull()
  })

  test("shows the colors section when told to", () => {
    renderCuesForm({ activeTab: "colors" })

    expect(
      screen.getByText("Select a color and drag it to the grid")
    ).toBeInTheDocument()
    expect(screen.getByTestId("cue-name")).toBeInTheDocument()
    expect(screen.queryByLabelText("Search media")).toBeNull()
  })

  test("pre-fills cue name from cueData when editing", () => {
    renderCuesForm({
      activeTab: "colors",
      cueData: {
        _id: "cue-1",
        name: "Existing cue",
        index: 0,
        screen: 1,
        file: { name: "example.png", type: "image/png" },
      },
    })

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

  test("offers the big upload button only while the pool is empty", () => {
    renderCuesForm()

    expect(screen.getByTestId("media-upload-cta")).toBeVisible()
    expect(screen.queryByLabelText("Search media")).toBeNull()
  })

  test("shrinks uploading to an icon beside the search bar once the pool fills", () => {
    renderCuesForm({ mediaLibrary: [mediaItem()] })

    expect(screen.queryByTestId("media-upload-cta")).toBeNull()
    expect(screen.getByLabelText("Search media")).toBeVisible()
    expect(screen.getByRole("button", { name: "Upload media" })).toBeVisible()
  })

  test("filters the pool by name as you type", () => {
    renderCuesForm({
      mediaLibrary: [
        mediaItem(),
        mediaItem({ id: "media-2", name: "backdrop.png" }),
      ],
    })

    expect(screen.getByText("Media Pool (2)")).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText("Search media"), {
      target: { value: "back" },
    })

    expect(screen.getByText("Media Pool (1 of 2)")).toBeInTheDocument()
    expect(screen.getByText("backdrop.png")).toBeInTheDocument()
    expect(screen.queryByText("photo.png")).toBeNull()
  })

  test("says so when nothing matches the search", () => {
    renderCuesForm({ mediaLibrary: [mediaItem()] })

    fireEvent.change(screen.getByLabelText("Search media"), {
      target: { value: "nothing here" },
    })

    expect(
      screen.getByText('No media matches "nothing here".')
    ).toBeInTheDocument()
  })

  test("previews a video with a video element, not an icon", () => {
    renderCuesForm({
      mediaLibrary: [
        mediaItem({ id: "media-3", name: "clip.mp4", type: "video/mp4" }),
      ],
    })

    const preview = screen.getByTestId("video-preview-media-3")
    expect(preview.tagName).toBe("VIDEO")
    // The media fragment asks for a frame past 0s, where some encodes are black.
    expect(preview).toHaveAttribute("src", "https://example.com/media-1#t=0.1")
    expect(preview).toHaveAttribute("preload", "metadata")
  })

  test("previews a legacy video whose stored type is the schema default", () => {
    renderCuesForm({
      mediaLibrary: [
        // What a cue uploaded before the routes recorded `type` reads back as.
        mediaItem({ id: "media-6", name: "vanha.mp4", type: "image/jpeg" }),
      ],
    })

    expect(screen.getByTestId("video-preview-media-6").tagName).toBe("VIDEO")
  })

  test("previews every audio entry with the same icon and no media request", () => {
    renderCuesForm({
      mediaLibrary: [
        mediaItem({ id: "media-4", name: "one.mp3", type: "audio/mpeg" }),
        mediaItem({ id: "media-5", name: "two.wav", type: "audio/wav" }),
      ],
    })

    expect(screen.getByText("one.mp3")).toBeInTheDocument()
    expect(screen.getByText("two.wav")).toBeInTheDocument()
    expect(screen.queryByTestId("video-preview-media-4")).toBeNull()
    expect(document.querySelectorAll("img")).toHaveLength(0)
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

    clickRemoveOn("photo.png")

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

    clickRemoveOn("photo.png")

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

    clickRemoveOn("photo.png")

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

  test("an audio entry sits in the same grid and drags as a sound", async () => {
    const { onDeleteMedia } = renderCuesForm({
      mediaLibrary: [
        mediaItem(),
        mediaItem({ id: "media-2", name: "sound.wav", type: "audio/wav" }),
      ],
    })

    // Images, videos and audio share one grid now.
    expect(screen.getByText("Media Pool (2)")).toBeInTheDocument()

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

    clickRemoveOn("sound.wav")
    fireEvent.click(await screen.findByRole("button", { name: "Delete" }))

    await waitFor(() => {
      expect(onDeleteMedia).toHaveBeenCalledWith("media-2")
    })
  })

  test("accepts audio through the same input as images and videos", async () => {
    const { onUploadMedia } = renderCuesForm()

    const soundInput = document.getElementById("media-upload")
    const audioFile = new File(["audio"], "sound.wav", { type: "audio/wav" })
    const imageFile = new File(["img"], "photo.png", { type: "image/png" })

    fireEvent.change(soundInput, { target: { files: [audioFile, imageFile] } })

    await waitFor(() => {
      expect(onUploadMedia).toHaveBeenCalledTimes(2)
    })
    expect(onUploadMedia).toHaveBeenCalledWith(audioFile)
    expect(onUploadMedia).toHaveBeenCalledWith(imageFile)
  })

  test("sets drag payload for color element", () => {
    renderCuesForm({ activeTab: "colors" })

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
    const { addCue, onClose } = renderCuesForm({ activeTab: "colors" })

    const form = screen.getByTestId("cue-name").closest("form")
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
      activeTab: "colors",
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

    const form = screen.getByTestId("cue-name").closest("form")
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
