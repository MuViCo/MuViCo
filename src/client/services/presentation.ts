/**
 * This module provides functions to interact with a SINGLE presentation's detailed operations.
 * It handles in-depth manipulation of one presentation via /api/presentation/:id endpoints.
 *
 * KEY DIFFERENCE from presentations.js:
 * - presentation.js (THIS FILE): Operates on ONE specific presentation (get, edit, manage cues, etc.)
 * - presentations.js: Operates on MULTIPLE presentations (list all, create new, basic CRUD)
 *
 * Functions include: get, remove, add/remove/update cues, save counts, shift indexes,
 * update name, and swap cues.
 */

import axios from "axios"
import getToken from "../auth"
import type {
  Cue,
  ImportScoreInput,
  Presentation,
  SaveIndexCountResponse,
  SaveScreenCountResponse,
  ShiftIndexesResponse,
  ScoreDocument,
  ScoreMarker,
  ScoreMarkerInput,
  DeleteMediaResponse,
  MediaLibraryItem,
  SwapCuesPayload,
  SwapCuesResponse,
  UpdateNameResponse,
  UploadScoreInput,
} from "../types"

const baseUrl = "/api/presentation/"

const authHeaders = () => ({
  Authorization: `bearer ${getToken()}`,
})

const jsonConfig = () => ({
  headers: {
    "Content-Type": "application/json",
    ...authHeaders(),
  },
})

const multipartConfig = () => ({
  headers: {
    "Content-Type": "multipart/form-data",
    ...authHeaders(),
  },
})

const get = async (id: string): Promise<Presentation> => {
  const config = {
    headers: {
      Authorization: `bearer ${getToken()}`,
    },
  }
  const response = await axios.get<Presentation>(`${baseUrl}${id}`, config)
  return response.data
}

const appendOptionalField = (
  formData: FormData,
  key: string,
  value?: string | number
) => {
  if (value !== undefined && value !== null && value !== "") {
    formData.append(key, String(value))
  }
}

const remove = async (id: string): Promise<void> => {
  const config = {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `bearer ${getToken()}`,
    },
  }
  const response = await axios.delete<void>(`${baseUrl}${id}`, config)
  return response.data
}

const getScores = async (id: string): Promise<ScoreDocument[]> => {
  const response = await axios.get<ScoreDocument[]>(`${baseUrl}${id}/scores`, {
    headers: authHeaders(),
  })
  return response.data
}

const uploadScorePdf = async (
  id: string,
  input: UploadScoreInput
): Promise<ScoreDocument> => {
  const formData = new FormData()
  formData.append("score", input.file)
  appendOptionalField(formData, "title", input.title)
  appendOptionalField(formData, "sourceUrl", input.sourceUrl)
  appendOptionalField(formData, "imslpId", input.imslpId)
  appendOptionalField(formData, "pageCount", input.pageCount)

  const response = await axios.post<ScoreDocument>(
    `${baseUrl}${id}/scores/upload`,
    formData,
    multipartConfig()
  )
  return response.data
}

const importImslpScore = async (
  id: string,
  input: ImportScoreInput
): Promise<ScoreDocument> => {
  const response = await axios.post<ScoreDocument>(
    `${baseUrl}${id}/scores/import`,
    input,
    jsonConfig()
  )
  return response.data
}

const deleteScore = async (id: string, scoreId: string): Promise<void> => {
  const response = await axios.delete<void>(
    `${baseUrl}${id}/scores/${scoreId}`,
    { headers: authHeaders() }
  )
  return response.data
}

const createScoreMarker = async (
  id: string,
  scoreId: string,
  marker: ScoreMarkerInput
): Promise<ScoreMarker> => {
  const response = await axios.post<ScoreMarker>(
    `${baseUrl}${id}/scores/${scoreId}/markers`,
    marker,
    jsonConfig()
  )
  return response.data
}

const updateScoreMarker = async (
  id: string,
  scoreId: string,
  markerId: string,
  marker: ScoreMarkerInput
): Promise<ScoreMarker> => {
  const response = await axios.put<ScoreMarker>(
    `${baseUrl}${id}/scores/${scoreId}/markers/${markerId}`,
    marker,
    jsonConfig()
  )
  return response.data
}

const deleteScoreMarker = async (
  id: string,
  scoreId: string,
  markerId: string
): Promise<void> => {
  const response = await axios.delete<void>(
    `${baseUrl}${id}/scores/${scoreId}/markers/${markerId}`,
    { headers: authHeaders() }
  )
  return response.data
}

/**
 * Adds a cue with file to the server.
 *
 * @param {string} id - The ID of the file.
 * @param {FormData} formData - The form data containing the file to be added.
 * @var {Config} Config - This is an object where you can specify additional information like headers.
 *    Here, you’re setting the ‘Content-Type’ header to ‘multipart/form-data’,
 *    which is used when you’re sending form data that includes files.
 * @returns {Promise} A promise that resolves to the response data from the server.
 */
/**
 * Adds a file to the presentation's media library.
 *
 * Uploading here is what makes the media pool survive a reload; the entry is
 * independent of any cue until one is created from it. There is no matching
 * list call: GET /:id already returns `media`, signed.
 */
const uploadMedia = async (
  id: string,
  file: File
): Promise<MediaLibraryItem> => {
  const formData = new FormData()
  formData.append("file", file)

  const response = await axios.post<MediaLibraryItem>(
    `${baseUrl}${id}/media`,
    formData,
    multipartConfig()
  )
  return response.data
}

const deleteMedia = async (
  id: string,
  mediaId: string
): Promise<DeleteMediaResponse> => {
  const response = await axios.delete<DeleteMediaResponse>(
    `${baseUrl}${id}/media/${mediaId}`,
    { headers: authHeaders() }
  )
  return response.data
}

const addCue = async (
  id: string,
  formData: FormData
): Promise<Presentation> => {
  const config = {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `bearer ${getToken()}`,
    },
  }
  const response = await axios.put<Presentation>(
    `${baseUrl}${id}`,
    formData,
    config
  )
  return response.data
}

const removeCue = async (id: string, cueId: string): Promise<Presentation> => {
  const config = {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `bearer ${getToken()}`,
    },
  }
  const response = await axios.delete<Presentation>(
    `${baseUrl}${id}/${cueId}`,
    config
  )
  return response.data
}

const updateCue = async (
  id: string,
  cueId: string,
  formData: FormData
): Promise<Cue> => {
  const config = {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `bearer ${getToken()}`,
    },
  }
  const response = await axios.put<Cue>(
    `${baseUrl}${id}/${cueId}`,
    formData,
    config
  )
  return response.data
}

const saveIndexCountApi = async (
  id: string,
  indexCount: number
): Promise<SaveIndexCountResponse> => {
  const config = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `bearer ${getToken()}`,
    },
  }
  const body = { indexCount }
  const response = await axios.put<SaveIndexCountResponse>(
    `${baseUrl}${id}/indexCount`,
    body,
    config
  )
  return response.data
}

const saveScreenCountApi = async (
  id: string,
  screenCount: number
): Promise<SaveScreenCountResponse> => {
  const config = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `bearer ${getToken()}`,
    },
  }
  const body = { screenCount }
  const response = await axios.put<SaveScreenCountResponse>(
    `${baseUrl}${id}/screenCount`,
    body,
    config
  )
  return response.data
}

const shiftIndexes = async (
  id: string,
  startIndex: number,
  direction: "left" | "right"
): Promise<ShiftIndexesResponse> => {
  const config = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `bearer ${getToken()}`,
    },
  }
  const body = { startIndex, direction }
  const response = await axios.put<ShiftIndexesResponse>(
    `${baseUrl}${id}/shiftIndexes`,
    body,
    config
  )
  return response.data
}

const updatePresentationName = async (
  id: string,
  newName: string
): Promise<UpdateNameResponse> => {
  const config = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `bearer ${getToken()}`,
    },
  }
  const body = { name: newName }
  const response = await axios.put<UpdateNameResponse>(
    `${baseUrl}${id}/name`,
    body,
    config
  )
  return response.data
}

const swapCues = async (
  id: string,
  payload: SwapCuesPayload
): Promise<SwapCuesResponse> => {
  const config = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `bearer ${getToken()}`,
    },
  }
  const response = await axios.put<SwapCuesResponse>(
    `${baseUrl}${id}/swapCues`,
    payload,
    config
  )
  return response.data
}

export default {
  get,
  remove,
  addCue,
  removeCue,
  uploadMedia,
  deleteMedia,
  updateCue,
  saveIndexCountApi,
  saveScreenCountApi,
  shiftIndexes,
  updatePresentationName,
  swapCues,
  getScores,
  uploadScorePdf,
  importImslpScore,
  deleteScore,
  createScoreMarker,
  updateScoreMarker,
  deleteScoreMarker,
}
