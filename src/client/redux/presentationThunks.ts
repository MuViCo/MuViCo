/** Presentation Thunks
 * These thunks handle asynchronous actions related to saving presentation settings,
 * such as index count and screen count.
 */

import { createAsyncThunk } from "@reduxjs/toolkit"
import presentationService from "../services/presentation"

import type { SaveIndexCountResponse, SaveScreenCountResponse } from "../types"

export const saveIndexCount = createAsyncThunk<
  SaveIndexCountResponse,
  { id: string; indexCount: number }
>("presentation/saveIndexCount", async ({ id, indexCount }) => {
  return await presentationService.saveIndexCountApi(id, indexCount)
})

export const saveScreenCount = createAsyncThunk<
  SaveScreenCountResponse,
  { id: string; screenCount: number }
>("presentation/saveScreenCount", async ({ id, screenCount }) => {
  return await presentationService.saveScreenCountApi(id, screenCount)
})
