import presentation from "../../services/presentation"
import "@testing-library/jest-dom"


describe("services tests", () => {
  test("presentation service calls remove", async () => {
    const remove = jest.fn()
    presentation.remove = remove
    remove.mockResolvedValueOnce({ data: "removed" })
    const response = await presentation.remove("1")
    expect(JSON.stringify(response)).toBe(JSON.stringify({ data: "removed" }))
  })

  test("presentation service calls removeCue", async () => {
    const removeCue = jest.fn()
    presentation.removeCue = removeCue
    removeCue.mockResolvedValueOnce({ data: "removed" })
    const response = await presentation.removeCue("1", "1")
    expect(JSON.stringify(response)).toBe(JSON.stringify({ data: "removed" }))
  })

  test("presentation service calls removeFile", async () => {
    const removeFile = jest.fn()
    presentation.removeFile = removeFile
    removeFile.mockResolvedValueOnce({ data: "removed" })
    const response = await presentation.removeFile("1", "1")
    expect(JSON.stringify(response)).toBe(JSON.stringify({ data: "removed" }))
  })

  test("presentation service calls addFile", async () => {
    const addFile = jest.fn()
    presentation.addFile = addFile
    addFile.mockResolvedValueOnce({ data: "added" })
    const response = await presentation.addFile("1", "formData")
    expect(JSON.stringify(response)).toBe(JSON.stringify({ data: "added" }))
  })

  test("presentation service calls updateCue", async () => {
    const updateCue = jest.fn()
    presentation.updateCue = updateCue
    updateCue.mockResolvedValueOnce({ data: "updated" })
    const formData = new FormData()
    formData.append("index", 1)
    formData.append("cueName", "testCue")
    formData.append("screen", 1)
    formData.append("file", new Blob(["file content"], { type: "text/plain" }), "test.txt")
    const response = await presentation.updateCue("1", "1", formData)
    expect(JSON.stringify(response)).toBe(JSON.stringify({ data: "updated" }))
  })

  test("presentation service calls updateCue with video", async () => {
    const updateCue = jest.fn()
    presentation.updateCue = updateCue
    updateCue.mockResolvedValueOnce({ data: "updated" })
    const formData = new FormData()
    formData.append("index", 1)
    formData.append("cueName", "testCue")
    formData.append("screen", 1)
    formData.append("file", new Blob(["video content"], { type: "video/mp4" }), "test.mp4")
    const response = await presentation.updateCue("1", "1", formData)
    expect(JSON.stringify(response)).toBe(JSON.stringify({ data: "updated" }))
  })
})
