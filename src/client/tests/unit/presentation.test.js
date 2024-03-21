import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import {
  PresentationCues,
  PresentationFiles,
} from "../../components/presentation/index"
import { VideoInformationTable } from "../../components/presentation/Controlpanel"
import { CuesForm } from "../../components/presentation/Cues"
import presentation from "../../services/presentation"
import "@testing-library/jest-dom"

describe("PresentationPage", () => {
  test("cues are rendered", () => {
    const presentation = {
      cues: [
        { _id: "1", index: 1, name: "Cue 1", screen: 1, fileName: "cue1.jpg" },
        { _id: "2", index: 2, name: "Cue 2", screen: 2, fileName: "cue2.png" },
      ],
    }
    const removeCue = jest.fn()
    render(
      <PresentationCues presentation={presentation} removeCue={removeCue} />
    )
    expect(screen.getByText("Cues:")).toBeInTheDocument()
    expect(screen.getByText("Cue 2")).toBeInTheDocument()
  })

  test("files are rendered", () => {
    const presentation = {
      files: [
        { _id: "1", url: "http://localhost:3001/files/1", name: "file1" },
        { _id: "2", url: "http://localhost:3001/files/2", name: "file2" },
      ],
    }
    const removeFile = jest.fn()
    render(
      <PresentationFiles presentation={presentation} removeFile={removeFile} />
    )
    expect(screen.getByAltText("file1")).toBeInTheDocument()
    expect(screen.getByAltText("file2")).toBeInTheDocument()
  })
})

describe("Controlpanel", () => {
  test("VideoInformationTable renders", () => {
    const data = [
      { _id: "1", name: "video1", url: "http://localhost:3001/files/1" },
      { _id: "2", name: "video2", url: "http://localhost:3001/files/2" },
    ]
    render(<VideoInformationTable data={data} />)
    expect(screen.getByText("video1")).toBeInTheDocument()
    expect(screen.getByText("video2")).toBeInTheDocument()
  })
})

describe("services tests", () => {
  test("presentation service calls remove", async () => {
    const remove = jest.fn()
    presentation.remove = remove
    remove.mockResolvedValueOnce({ data: "removed" })
    const response = await presentation.remove("1")
    expect(response).toBe("removed")
  })

  test("presentation service calls removeCue", async () => {
    const removeCue = jest.fn()
    presentation.removeCue = removeCue
    removeCue.mockResolvedValueOnce({ data: "removed" })
    const response = await presentation.removeCue("1", "1")
    expect(response).toBe("removed")
  })

  test("presentation service calls removeFile", async () => {
    const removeFile = jest.fn()
    presentation.removeFile = removeFile
    removeFile.mockResolvedValueOnce({ data: "removed" })
    const response = await presentation.removeFile("1", "1")
    expect(response).toBe("removed")
  })

  test("presentation service calls addFile", async () => {
    const addFile = jest.fn()
    presentation.addFile = addFile
    addFile.mockResolvedValueOnce({ data: "added" })
    const response = await presentation.addFile("1", "formData")
    expect(response).toBe("added")
  })
})
