import CuesForm from "../../components/presentation/CuesForm"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import React from "react"
import { MemoryRouter } from "react-router-dom"

describe("CuesForm new element", () => {
  test("render form elements", () => {
    render(
      <MemoryRouter>
        <CuesForm indexCount={5} screenCount={4}/>
      </MemoryRouter>
    )
    expect(screen.getByText("Add element")).toBeInTheDocument()
    expect(screen.getByText(/Frame\s*0-4/i)).toBeInTheDocument()
    expect(screen.getByText("Name*")).toBeInTheDocument()
    
    const screenTexts = [
      "Screen 1 for images and videos and screen 2 for audio only*",
      "Screens 1-4 for images and videos and screen 5 for audio only*"
    ]
    const foundScreenText = screenTexts.some(text => 
      screen.queryByText(text) !== null
    )
    expect(foundScreenText).toBe(true)
    expect(screen.getAllByText("Upload media")).toHaveLength(2)
    expect(screen.getByText("or add blank element")).toBeInTheDocument()
    expect(screen.getByText("Add blank")).toBeInTheDocument()
    expect(screen.getByText("Submit")).toBeInTheDocument()
  })
})

  test("add cues form with black blank element", async () => {
    const addCue = jest.fn()
    const onClose = jest.fn()
    const mockCues = []

    render(
      <MemoryRouter>
        <CuesForm addCue={addCue} onClose={onClose} cues={mockCues} screenCount={4} />
      </MemoryRouter>
    )

    const cueNameInput = screen.getByTestId("cue-name")
    fireEvent.change(cueNameInput, { target: { value: "test cue" } })

    const screenInput = screen.getByTestId("screen-number")
    fireEvent.change(screenInput, { target: { value: "2" } })

    const indexInput = screen.getByTestId("index-number")
    fireEvent.change(indexInput, { target: { value: "5" } })

    const blankSelect = screen.getByTestId("add-blank")
    fireEvent.change(blankSelect, { target: { value: "/blank.png" } })

    expect(screen.getByText("Black blank element")).toBeInTheDocument()
    
    const submitButton = screen.getByText("Submit")
    fireEvent.click(submitButton)

    expect(addCue).toHaveBeenCalledWith({
      file: "/blank.png",
      index: 0,
      cueName: "test cue",
      screen: 2,
      fileName: "",
      loop: false,
    })
    expect(onClose).toHaveBeenCalled()
  })

  test("add cues form with white blank element", async () => {
    const addCue = jest.fn()
    const onClose = jest.fn()
    const mockCues = []

    render(
      <MemoryRouter>
        <CuesForm addCue={addCue} onClose={onClose} cues={mockCues} screenCount={4} />
      </MemoryRouter>
    )

    const cueNameInput = screen.getByTestId("cue-name")
    fireEvent.change(cueNameInput, { target: { value: "test cue" } })

    const screenInput = screen.getByTestId("screen-number")
    fireEvent.change(screenInput, { target: { value: "2" } })

    const indexInput = screen.getByTestId("index-number")
    fireEvent.change(indexInput, { target: { value: "5" } })

    const blankSelect = screen.getByTestId("add-blank")
    fireEvent.change(blankSelect, { target: { value: "/blank-white.png" } })

    expect(screen.getByText("White blank element")).toBeInTheDocument()
    
    const submitButton = screen.getByText("Submit")
    fireEvent.click(submitButton)

    expect(addCue).toHaveBeenCalledWith({
      file: "/blank-white.png",
      index: 0,
      cueName: "test cue",
      screen: 2,
      fileName: "",
      loop: false,
    })
    expect(onClose).toHaveBeenCalled()
  })

  test("add cues form with indigo blank element", async () => {
    const addCue = jest.fn()
    const onClose = jest.fn()
    const mockCues = []

    render(
      <MemoryRouter>
        <CuesForm addCue={addCue} onClose={onClose} cues={mockCues} screenCount={4} />
      </MemoryRouter>
    )

    const cueNameInput = screen.getByTestId("cue-name")
    fireEvent.change(cueNameInput, { target: { value: "test cue" } })

    const screenInput = screen.getByTestId("screen-number")
    fireEvent.change(screenInput, { target: { value: "2" } })

    const indexInput = screen.getByTestId("index-number")
    fireEvent.change(indexInput, { target: { value: "5" } })

    const blankSelect = screen.getByTestId("add-blank")
    fireEvent.change(blankSelect, { target: { value: "/blank-indigo.png" } })

    expect(screen.getByText("Indigo blank element")).toBeInTheDocument()
    
    const submitButton = screen.getByText("Submit")
    fireEvent.click(submitButton)

    expect(addCue).toHaveBeenCalledWith({
      file: "/blank-indigo.png",
      index: 0,
      cueName: "test cue",
      screen: 2,
      fileName: "",
      loop: false,
    })
    expect(onClose).toHaveBeenCalled()
  })

  test("add cues form with tropical indigo blank element", async () => {
    const addCue = jest.fn()
    const onClose = jest.fn()
    const mockCues = []

    render(
      <MemoryRouter>
        <CuesForm addCue={addCue} onClose={onClose} cues={mockCues} screenCount={4} />
      </MemoryRouter>
    )

    const cueNameInput = screen.getByTestId("cue-name")
    fireEvent.change(cueNameInput, { target: { value: "test cue" } })

    const screenInput = screen.getByTestId("screen-number")
    fireEvent.change(screenInput, { target: { value: "2" } })

    const indexInput = screen.getByTestId("index-number")
    fireEvent.change(indexInput, { target: { value: "5" } })

    const blankSelect = screen.getByTestId("add-blank")
    fireEvent.change(blankSelect, { target: { value: "/blank-tropicalindigo.png" } })

    expect(screen.getByText("Tropical indigo blank element")).toBeInTheDocument()
    
    const submitButton = screen.getByText("Submit")
    fireEvent.click(submitButton)

    expect(addCue).toHaveBeenCalledWith({
      file: "/blank-tropicalindigo.png",
      index: 0,
      cueName: "test cue",
      screen: 2,
      fileName: "",
      loop: false,
    })
    expect(onClose).toHaveBeenCalled()
  })

  test("add cues form with a file", async () => {
    const addCue = jest.fn()
    const onClose = jest.fn()
    const mockCues = []

    render(
      <MemoryRouter>
        <CuesForm addCue={addCue} onClose={onClose} cues={mockCues} screenCount={4} />
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
      index: 0,
      cueName: "test cue",
      screen: 2,
      fileName: "testfile.png",
      loop: false,
    })
    expect(onClose).toHaveBeenCalled()
  })

  test("upload invalid filetype", async () => {
    const addCue = jest.fn()
    const onClose = jest.fn()
    const mockCues = []

    render(
      <MemoryRouter>
        <CuesForm addCue={addCue} onClose={onClose} cues={mockCues} screenCount={4} />
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
    const mockCues = []

    render(
      <MemoryRouter>
        <CuesForm addCue={addCue} onClose={onClose} cues={mockCues} screenCount={4} />
      </MemoryRouter>
    )

    const cueNameInput = screen.getByTestId("cue-name")
    fireEvent.change(cueNameInput, { target: { value: "test audio cue" } })

    const indexInput = screen.getByTestId("index-number")
    fireEvent.change(indexInput, { target: { value: "2" } })

    const fileInput = screen.getByLabelText("Upload media")
    const audioFile = new File([""], "test.mp3", { type: "audio/mpeg" })
    fireEvent.change(fileInput, { target: { files: [audioFile] } })

    const submitButton = screen.getByText("Submit")
    fireEvent.click(submitButton)

    expect(addCue).toHaveBeenCalledWith({
      file: audioFile,
      index: 0,
      cueName: "test audio cue",
      screen: 5,
      fileName: "test.mp3",
      loop: false,
    })
    expect(onClose).toHaveBeenCalled()
  })

  test("upload invalid audio file type to audio screen", async () => {
    const addCue = jest.fn()
    const onClose = jest.fn()
    const mockCues = []

    render(
      <MemoryRouter>
        <CuesForm addCue={addCue} onClose={onClose} cues={mockCues} screenCount={4} />
      </MemoryRouter>
    )

    const cueNameInput = screen.getByTestId("cue-name")
    fireEvent.change(cueNameInput, { target: { value: "test cue" } })

    const screenInput = screen.getByTestId("screen-number")
    fireEvent.change(screenInput, { target: { value: "5" } })

    const indexInput = screen.getByTestId("index-number")
    fireEvent.change(indexInput, { target: { value: "2" } })

    const fileInput = screen.getByLabelText("Upload media")
    const invalidAudioFile = new File([""], "test.flac", { type: "audio/flac" })
    fireEvent.change(fileInput, { target: { files: [invalidAudioFile] } })

    const submitButton = screen.getByText("Submit")
    fireEvent.click(submitButton)

    expect(addCue).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()

    expect(
      screen.queryByText(
        "Invalid file type. Only audio files (.mp3, .wav) are allowed on the audio screen."
      )
    ).toBeInTheDocument()
  })

  test("handle file without type property on visual screen", async () => {
    const addCue = jest.fn()
    const onClose = jest.fn()
    const mockCues = []

    render(
      <MemoryRouter>
        <CuesForm addCue={addCue} onClose={onClose} cues={mockCues} screenCount={4} />
      </MemoryRouter>
    )

    const cueNameInput = screen.getByTestId("cue-name")
    fireEvent.change(cueNameInput, { target: { value: "test cue" } })

    const screenInput = screen.getByTestId("screen-number")
    fireEvent.change(screenInput, { target: { value: "4" } })

    const submitButton = screen.getByText("Submit")
    fireEvent.click(submitButton)

    expect(addCue).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()

    expect(
      await screen.findByText("Please select a file or blank element")
    ).toBeInTheDocument()
  })

  test("handle file without type property on audio screen", async () => {
    const addCue = jest.fn()
    const onClose = jest.fn()
    const mockCues = []

    render(
      <MemoryRouter>
        <CuesForm addCue={addCue} onClose={onClose} cues={mockCues} screenCount={4} />
      </MemoryRouter>
    )

    const cueNameInput = screen.getByTestId("cue-name")
    fireEvent.change(cueNameInput, { target: { value: "test cue" } })

    const screenInput = screen.getByTestId("screen-number")
    fireEvent.change(screenInput, { target: { value: "5" } })

    const submitButton = screen.getByText("Submit")
    fireEvent.click(submitButton)

    expect(addCue).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()

    expect(
      await screen.findByText("Please select an audio file")
    ).toBeInTheDocument()
  })

  test("prevent adding blank element to audio screen", async () => {
    const addCue = jest.fn()
    const onClose = jest.fn()
    const mockCues = []

    render(
      <MemoryRouter>
        <CuesForm addCue={addCue} onClose={onClose} cues={mockCues} screenCount={4} />
      </MemoryRouter>
    )

    const cueNameInput = screen.getByTestId("cue-name")
    fireEvent.change(cueNameInput, { target: { value: "test cue" } })

    const screenInput = screen.getByTestId("screen-number")
    fireEvent.change(screenInput, { target: { value: "5" } })

    const indexInput = screen.getByTestId("index-number")
    fireEvent.change(indexInput, { target: { value: "2" } })

    const blankSelect = screen.getByTestId("add-blank")
    fireEvent.change(blankSelect, { target: { value: "/blank.png" } })

    expect(
      screen.queryByText("Blank elements are not allowed on the audio screen. Please select an audio file instead.")
    ).toBeInTheDocument()

    const submitButton = screen.getByText("Submit")
    fireEvent.click(submitButton)

    expect(addCue).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()

    expect(
      screen.queryByText("Blank elements are not allowed on the audio screen")
    ).toBeInTheDocument()
  })

  test("prevent adding empty element to audio screen", async () => {
    const addCue = jest.fn()
    const onClose = jest.fn()
    const mockCues = []

    render(
      <MemoryRouter>
        <CuesForm addCue={addCue} onClose={onClose} cues={mockCues} screenCount={4} />
      </MemoryRouter>
    )

    const cueNameInput = screen.getByTestId("cue-name")
    fireEvent.change(cueNameInput, { target: { value: "test cue" } })

    const screenInput = screen.getByTestId("screen-number")
    fireEvent.change(screenInput, { target: { value: "5" } })

    const indexInput = screen.getByTestId("index-number")
    fireEvent.change(indexInput, { target: { value: "2" } })
    
    const submitButton = screen.getByText("Submit")
    fireEvent.click(submitButton)

    expect(addCue).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
    
    expect(
      screen.queryByText("Please select an audio file")
    ).toBeInTheDocument()
  })

  test("clear file input when switching from choosing file to choosing blank", async () => {
    const addCue = jest.fn()
    const onClose = jest.fn()
    const mockCues = []

    render(
      <MemoryRouter>
        <CuesForm addCue={addCue} onClose={onClose} cues={mockCues} screenCount={4} />
      </MemoryRouter>
    )

    const cueNameInput = screen.getByTestId("cue-name")
    fireEvent.change(cueNameInput, { target: { value: "test cue" } })

    const screenInput = screen.getByTestId("screen-number")
    fireEvent.change(screenInput, { target: { value: "5" } })

    const indexInput = screen.getByTestId("index-number") 
    fireEvent.change(indexInput, { target: { value: "2" } })

    const fileInput = screen.getByLabelText("Upload media")
    const audioFile = new File([""], "test.mp3", { type: "audio/mpeg" })
    fireEvent.change(fileInput, { target: { files: [audioFile] } })

    expect(screen.queryByText("test.mp3")).toBeInTheDocument()

    const blankSelect = screen.getByTestId("add-blank")
    fireEvent.change(blankSelect, { target: { value: "/blank.png" }  })

    expect(screen.queryByText("Blank elements are not allowed on the audio screen. Please select an audio file instead.")).toBeInTheDocument()
    expect(screen.queryByText("test.mp3")).not.toBeInTheDocument()

    const file2Input = screen.getByLabelText("Upload media")
    const audio2File = new File([""], "test2.mp3", { type: "audio/mpeg" })
    fireEvent.change(file2Input, { target: { files: [audio2File] } })

    expect(screen.queryByText("test2.mp3")).toBeInTheDocument()
    expect(screen.queryByText("test.mp3")).not.toBeInTheDocument()
    expect(screen.queryByText("Blank elements are not allowed on the audio screen. Please select an audio file instead.")).not.toBeInTheDocument()
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
          screenCount={4}
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

  test("update cues form with black blank element", async () => {
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
          screenCount={4}
        />
      </MemoryRouter>
    )

    const screenInput = screen.getByTestId("screen-number")
    fireEvent.change(screenInput, { target: { value: "2" } })

    const indexInput = screen.getByTestId("index-number")
    fireEvent.change(indexInput, { target: { value: "1" } })

    const nameInput = screen.getByTestId("cue-name")
    fireEvent.change(nameInput, { target: { value: "updated_testtt" } })

    const blankSelect = screen.getByTestId("add-blank")
    fireEvent.change(blankSelect, { target: { value: "/blank.png" } })

    const submitButton = screen.getByText("Submit")
    fireEvent.click(submitButton)

    expect(updateCue).toHaveBeenCalledWith("123456789", {
      cueId: "123456789",
      cueName: "updated_testtt",
      index: 1,
      screen: 2,
      file: "/blank.png",
      fileName: "image1.jpg",
    })
    await waitFor(
      () => {
        expect(onClose).toHaveBeenCalled()
      },
      { timeout: 2000 }
    )
  }, 3000)


  test("update cues form with white blank element", async () => {
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
          screenCount={4}
        />
      </MemoryRouter>
    )

    const blankSelect = screen.getByTestId("add-blank")
    fireEvent.change(blankSelect, { target: { value: "/blank-white.png" } })

    expect(screen.getByText("White blank element")).toBeInTheDocument()

    const submitButton = screen.getByText("Submit")
    fireEvent.click(submitButton)

    expect(updateCue).toHaveBeenCalledWith("123456789", {
      cueId: "123456789",
      cueName: "testtt",
      index: 0,
      screen: 1,
      file: "/blank-white.png",
      fileName: "image1.jpg",
    })
  })

  test("update cues form with indigo blank element", async () => {
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
          screenCount={4}
        />
      </MemoryRouter>
    )

    const blankSelect = screen.getByTestId("add-blank")
    fireEvent.change(blankSelect, { target: { value: "/blank-indigo.png" } })

    expect(screen.getByText("Indigo blank element")).toBeInTheDocument()

    const submitButton = screen.getByText("Submit")
    fireEvent.click(submitButton)

    expect(updateCue).toHaveBeenCalledWith("123456789", {
      cueId: "123456789",
      cueName: "testtt",
      index: 0,
      screen: 1,
      file: "/blank-indigo.png",
      fileName: "image1.jpg",
    })
  })

  test("update cues form with tropical indigo blank element", async () => {
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
          screenCount={4}
        />
      </MemoryRouter>
    )

    const blankSelect = screen.getByTestId("add-blank")
    fireEvent.change(blankSelect, { target: { value: "/blank-tropicalindigo.png" } })

    expect(screen.getByText("Tropical indigo blank element")).toBeInTheDocument()

    const submitButton = screen.getByText("Submit")
    fireEvent.click(submitButton)

    expect(updateCue).toHaveBeenCalledWith("123456789", {
      cueId: "123456789",
      cueName: "testtt",
      index: 0,
      screen: 1,
      file: "/blank-tropicalindigo.png",
      fileName: "image1.jpg",
    })
  })

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
          screenCount={4}
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
        "Invalid file type. Please see the info button for valid visual file types."
      )
    ).toBeInTheDocument()
  })
})
