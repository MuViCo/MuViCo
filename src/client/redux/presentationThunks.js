import { createAsyncThunk } from "@reduxjs/toolkit"
import presentationService from "../services/presentation"

export const saveIndexCount = createAsyncThunk(
  "presentation/saveIndexCount",
  async ({ id, indexCount }) => {
    return await presentationService.saveIndexCountApi(id, indexCount)
  }
)

export const saveScreenCount = createAsyncThunk(
  "presentation/saveScreenCount",
  async ({ id, screenCount }) => {
    return await presentationService.saveScreenCountApi(id, screenCount)
  }
)
