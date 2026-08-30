/*
 * Presentation service API unit tests.
 * Verifies axios request contracts for presentation fetch/delete,
 * cue CRUD, index/screen count updates, shiftIndexes, and name updates.
 */
const axios = require("axios")
const presentation = require("../../services/presentation")
const get = presentation.default.get
const remove = presentation.default.remove
const addCue = presentation.default.addCue
const removeCue = presentation.default.removeCue
const updateCue = presentation.default.updateCue
const getScores = presentation.default.getScores
const uploadScorePdf = presentation.default.uploadScorePdf
const importImslpScore = presentation.default.importImslpScore
const deleteScore = presentation.default.deleteScore
const createScoreMarker = presentation.default.createScoreMarker

jest.mock("axios")

const token = "bearer null"
const id = 1
const baseUrl = "/api/presentation/"
const mockCues = [
  {
    file: { url: "http://example.com/image1.jpg" },
    index: 0,
    name: "testtt",
    screen: 1,
    _id: "123456789",
  },
  {
    file: { url: "http://example.com/image2.jpg" },
    index: 1,
    name: "testtt2",
    screen: 2,
    _id: "987654321",
  },
]

const new_mockCue = {
  file: { url: "http://example.com/image3.png" },
  index: 2,
  name: "testCue",
  screen: 3,
  _id: "123456798",
}

const cueId = "123456789"
const scoreId = "score-1"
const markerId = "marker-1"
// Shared multipart payload fixture for addCue/updateCue request contract checks.
const formData = new FormData()
formData.append("index", 1)
formData.append("cueName", "testCue")
formData.append("screen", 1)
formData.append(
  "file",
  new Blob(["file content"], { type: "image/png" }),
  "test.png"
)

describe("presentation services api tests", () => {
  test("get presentation api call behaves as expected", async () => {
    const response = {
      cues: mockCues,
      id: id,
      name: "test presentation",
      user: "user id",
    }

    axios.get.mockResolvedValue({ data: response })

    const result = await get(id)
    expect(result).toEqual(response)
    expect(axios.get).toHaveBeenCalledWith(`${baseUrl}${id}`, {
      headers: { Authorization: token },
    })
  })

  test("remove presentation api call behaves as expected", async () => {
    const response = {}

    axios.delete.mockResolvedValue({ data: response })

    const result = await remove(id)
    expect(result).toEqual(response)
    expect(axios.delete).toHaveBeenCalledWith(`${baseUrl}${id}`, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: token,
      },
    })
  })

  test("addCue in presentation api call behaves as expected", async () => {
    const response = {
      cues: [...mockCues, new_mockCue],
      id: id,
      name: "test presentation",
      user: "user id",
    }

    axios.put.mockResolvedValue({ data: response })

    const result = await addCue(id, formData)
    expect(result).toEqual(response)
    expect(axios.put).toHaveBeenCalledWith(`${baseUrl}${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: token,
      },
    })
  })

  test("removeCue in presentation api call behaves as expected", async () => {
    const response = {
      cues: [mockCues[1]],
      id: id,
      name: "test presentation",
      user: "user id",
    }
    axios.delete.mockResolvedValue({ data: response })
    const result = await removeCue(id, cueId)
    expect(result).toEqual(response)
    expect(axios.delete).toHaveBeenCalledWith(`${baseUrl}${id}/${cueId}`, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: token,
      },
    })
  })

  test("updateCue in presentation api call behaves as expected", async () => {
    const file = { url: "http://example.com/image3.png" }
    const response = {
      file: file,
      index: 1,
      name: "testing",
      screen: 2,
      _id: cueId,
    }

    axios.put.mockResolvedValue({ data: response })

    const result = await updateCue(id, cueId, formData)
    expect(result).toEqual(response)
    expect(axios.put).toHaveBeenCalledWith(
      `${baseUrl}${id}/${cueId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: token,
        },
      }
    )
  })

  test("getScores in presentation api call behaves as expected", async () => {
    const response = [
      {
        _id: scoreId,
        title: "Piano score",
        source: "upload",
        file: { name: "score.pdf", url: "http://example.com/score.pdf" },
        markers: [],
      },
    ]

    axios.get.mockResolvedValue({ data: response })

    const result = await getScores(id)
    expect(result).toEqual(response)
    expect(axios.get).toHaveBeenCalledWith(`${baseUrl}${id}/scores`, {
      headers: { Authorization: token },
    })
  })

  test("uploadScorePdf in presentation api call behaves as expected", async () => {
    const file = new File(["score"], "score.pdf", { type: "application/pdf" })
    const response = {
      _id: scoreId,
      title: "Score",
      source: "upload",
      file: { name: "score.pdf" },
      markers: [],
    }

    axios.post.mockResolvedValue({ data: response })

    const result = await uploadScorePdf(id, {
      file,
      title: "Score",
      pageCount: 12,
    })

    expect(result).toEqual(response)
    const [url, body, config] = axios.post.mock.calls.at(-1)
    expect(url).toBe(`${baseUrl}${id}/scores/upload`)
    expect(body).toBeInstanceOf(FormData)
    expect(body.get("score")).toBe(file)
    expect(body.get("title")).toBe("Score")
    expect(body.get("pageCount")).toBe("12")
    expect(config).toEqual({
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: token,
      },
    })
  })

  test("importImslpScore in presentation api call behaves as expected", async () => {
    const body = {
      sourceUrl: "https://imslp.org/wiki/File:IMSLP939945.pdf",
      title: "IMSLP score",
    }
    const response = {
      _id: scoreId,
      title: "IMSLP score",
      source: "imslp",
      sourceUrl: body.sourceUrl,
      markers: [],
    }

    axios.post.mockResolvedValue({ data: response })

    const result = await importImslpScore(id, body)
    expect(result).toEqual(response)
    expect(axios.post).toHaveBeenCalledWith(
      `${baseUrl}${id}/scores/import`,
      body,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      }
    )
  })

  test("deleteScore in presentation api call behaves as expected", async () => {
    axios.delete.mockResolvedValue({ data: undefined })

    const result = await deleteScore(id, scoreId)
    expect(result).toBeUndefined()
    expect(axios.delete).toHaveBeenCalledWith(
      `${baseUrl}${id}/scores/${scoreId}`,
      {
        headers: { Authorization: token },
      }
    )
  })

  test("createScoreMarker in presentation api call behaves as expected", async () => {
    const marker = {
      page: 1,
      frameIndex: 2,
      measureLabel: "A",
    }
    const response = {
      _id: markerId,
      ...marker,
    }

    axios.post.mockResolvedValue({ data: response })

    const result = await createScoreMarker(id, scoreId, marker)
    expect(result).toEqual(response)
    expect(axios.post).toHaveBeenCalledWith(
      `${baseUrl}${id}/scores/${scoreId}/markers`,
      marker,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      }
    )
  })

  test("shiftIndexes in presentation api call behaves as expected", async () => {
    // Contract: shiftIndexes sends JSON body with startIndex + direction.
    const response = {
      shifted: true,
      cues: [{ ...mockCues[0] }, { ...mockCues[1], index: 2 }],
    }

    axios.put.mockResolvedValue({ data: response })

    const startIndex = 1
    const direction = "right"
    const body = { startIndex, direction }

    const result = await presentation.default.shiftIndexes(
      id,
      startIndex,
      direction
    )

    expect(result).toEqual(response)
    expect(axios.put).toHaveBeenCalledWith(
      `${baseUrl}${id}/shiftIndexes`,
      body,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      }
    )
  })

  test("saveIndexCountApi in presentation api call behaves as expected", async () => {
    const response = {
      indexCount: 5,
    }

    axios.put.mockResolvedValue({ data: response })

    const indexCount = 5

    const result = await presentation.default.saveIndexCountApi(id, indexCount)
    expect(result).toEqual(response)
    expect(axios.put).toHaveBeenCalledWith(
      `${baseUrl}${id}/indexCount`,
      { indexCount },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      }
    )
  })

  test("saveScreenCountApi in presentation api call behaves as expected", async () => {
    const response = {
      screenCount: 3,
    }

    axios.put.mockResolvedValue({ data: response })

    const screenCount = 3

    const result = await presentation.default.saveScreenCountApi(
      id,
      screenCount
    )
    expect(result).toEqual(response)
    expect(axios.put).toHaveBeenCalledWith(
      `${baseUrl}${id}/screenCount`,
      { screenCount },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      }
    )
  })

  test("updatePresentationName in presentation api call behaves as expected", async () => {
    const response = {
      id: id,
      name: "Updated Presentation Name",
    }

    axios.put.mockResolvedValue({ data: response })

    const newName = "Updated Presentation Name"

    const result = await presentation.default.updatePresentationName(
      id,
      newName
    )
    expect(result).toEqual(response)
    expect(axios.put).toHaveBeenCalledWith(
      `${baseUrl}${id}/name`,
      { name: newName },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      }
    )
  })
})
