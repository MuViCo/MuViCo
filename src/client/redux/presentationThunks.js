import { createAsyncThunk } from "@reduxjs/toolkit"
import presentationService from "../services/presentation"

export const saveIndexCount = createAsyncThunk(
  "presentation/saveIndexCount",
  async ({ id, indexCount }) => {
    return await presentationService.saveIndexCount(id, indexCount)
  }
)

export const saveScreenCount = createAsyncThunk(
  "presentation/saveScreenCount",
  async ({ id, screenCount }) => {
    return await presentationService.saveScreenCount(id, screenCount)
  }
)
