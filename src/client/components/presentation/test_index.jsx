import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { PresentationPage } from "./index"

describe("PresentationPage", () => {
  const mockUserId = "123"
  const mockPresentation = {
    _id: "456",
    name: "Sample Presentation",
    cues: 5,
    files: [
      { _id: "file1", url: "https://example.com/file1", name: "File 1" },
      { _id: "file2", url: "https://example.com/file2", name: "File 2" },
    ],
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, "log").mockImplementation(() => {})
    jest.spyOn(window, "fetch").mockResolvedValueOnce({
      json: jest.fn().mockResolvedValueOnce(mockPresentation),
    })
  })

  test("renders \"Nice try\" message when presentationInfo is null", async () => {
    render(<PresentationPage userId={mockUserId} />)
    expect(await screen.findByText("Nice try, you don't have access to this page! :(")).toBeInTheDocument()
  })

  test("renders presentation name and file list when presentationInfo is not null", async () => {
    render(<PresentationPage userId={mockUserId} />)
    expect(await screen.findByText(mockPresentation.name)).toBeInTheDocument()
    expect(screen.getAllByRole("img")).toHaveLength(mockPresentation.files.length)
    expect(screen.getAllByRole("button", { name: "Remove file" })).toHaveLength(mockPresentation.files.length)
  })

  test("calls addFile and updates state when form is submitted", async () => {
    render(<PresentationPage userId={mockUserId} />)
    const fileInput = screen.getByLabelText("File")
    const nameInput = screen.getByPlaceholderText("Name")
    const submitButton = screen.getByRole("button", { name: "Submit" })

    const mockFile = new File(["file contents"], "file.png", { type: "image/png" })
    fireEvent.change(fileInput, { target: { files: [mockFile] } })
    fireEvent.change(nameInput, { target: { value: "New File" } })
    fireEvent.click(submitButton)

    expect(window.fetch).toHaveBeenCalledWith(`/api/presentations/${mockPresentation._id}/files`, expect.any(FormData))
    expect(nameInput.value).toBe("")
    expect(fileInput.value).toBe("")
  })

  test("calls removeFile and updates state when \"Remove file\" button is clicked", async () => {
    render(<PresentationPage userId={mockUserId} />)
    const removeButtons = screen.getAllByRole("button", { name: "Remove file" })

    fireEvent.click(removeButtons[0])

    expect(window.fetch).toHaveBeenCalledWith(`/api/presentations/${mockPresentation._id}/files/${mockPresentation.files[0]._id}`, { method: "DELETE" })
  })
})
