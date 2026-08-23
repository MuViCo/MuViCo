/**
 * This module provides functions to interact with MULTIPLE presentations (listing/CRUD operations).
 * It handles listing all presentations and basic create/update operations via /api/home/ endpoints.
 *
 * KEY DIFFERENCE from presentation.js:
 * - presentations.js (THIS FILE): Operates on MULTIPLE presentations (list all, create new, basic CRUD)
 * - presentation.js: Operates on ONE specific presentation (detailed edits, cue management, etc.)
 *
 * Functions include: getAll, getById, create, and update.
 */

import axios from "axios"

import getToken from "../auth"
import type {
  CreatePresentationInput,
  Presentation,
  UpdatePresentationInput,
} from "../types"

const baseUrl = "/api/home/"

const getAll = (): Promise<Presentation[]> => {
  const config = {
    headers: { Authorization: `Bearer ${getToken()}` },
  }

  const request = axios.get<Presentation[]>(baseUrl, config)
  return request.then((response) => response.data)
}

const getById = async (id: string): Promise<Presentation> => {
  const config = {
    headers: { Authorization: `Bearer ${getToken()}` },
  }

  const response = await axios.get<Presentation>(baseUrl + id, config)
  return response.data
}

const create = async (
  newObject: CreatePresentationInput
): Promise<Presentation> => {
  const config = {
    headers: { Authorization: `Bearer ${getToken()}` },
  }

  const response = await axios.post<Presentation>(baseUrl, newObject, config)
  return response.data
}

const update = async (
  id: string,
  updatedObject: UpdatePresentationInput
): Promise<Presentation> => {
  const config = {
    headers: { Authorization: `Bearer ${getToken()}` },
  }

  const response = await axios.put<Presentation>(
    baseUrl + id,
    updatedObject,
    config
  )
  return response.data
}

export default { getAll, getById, create, update }
