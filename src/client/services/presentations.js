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

const baseUrl = "/api/home/"

const getAll = () => {
  const config = {
    headers: { Authorization: `Bearer ${getToken()}` },
  }

  const request = axios.get(baseUrl, config)
  return request.then((response) => response.data)
}

const getById = async (id) => {
  const config = {
    headers: { Authorization: `Bearer ${getToken()}` },
  }

  const response = await axios.get(baseUrl + id, config)
  return response.data
}

const create = async (newObject) => {
  const config = {
    headers: { Authorization: `Bearer ${getToken()}` },
  }

  const response = await axios.post(baseUrl, newObject, config)
  return response.data
}

const update = async (id, updatedObject) => {
  const config = {
    headers: { Authorization: `Bearer ${getToken()}` },
  }

  const response = await axios.put(baseUrl + id, updatedObject, config)
  return response.data
}

export default { getAll, getById, create, update }
