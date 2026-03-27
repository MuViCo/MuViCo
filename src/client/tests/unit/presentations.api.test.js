import axios from "axios"
import presentationsService from "../../services/presentations"

jest.mock("axios")

describe("presentations home service api", () => {
  const token = "Bearer null"

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("getAll calls /api/home with auth header", async () => {
    const responseData = [{ id: "1", name: "A" }]
    axios.get.mockResolvedValue({ data: responseData })

    const result = await presentationsService.getAll()

    expect(result).toEqual(responseData)
    expect(axios.get).toHaveBeenCalledWith("/api/home/", {
      headers: { Authorization: token },
    })
  })

  test("getById calls /api/home/:id with auth header", async () => {
    const responseData = { id: "1", name: "Presentation" }
    axios.get.mockResolvedValue({ data: responseData })

    const result = await presentationsService.getById("1")

    expect(result).toEqual(responseData)
    expect(axios.get).toHaveBeenCalledWith("/api/home/1", {
      headers: { Authorization: token },
    })
  })

  test("update sends name and description to PUT /api/home/:id", async () => {
    const payload = {
      name: "Updated title",
      description: "Updated description for list/grid edit",
    }
    axios.put.mockResolvedValue({ data: { id: "1", ...payload } })

    const result = await presentationsService.update("1", payload)

    expect(result).toEqual({ id: "1", ...payload })
    expect(axios.put).toHaveBeenCalledWith("/api/home/1", payload, {
      headers: { Authorization: token },
    })
  })
})
