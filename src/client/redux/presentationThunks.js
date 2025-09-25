import { createAsyncThunk } from "@reduxjs/toolkit"
import presentationService from "../services/presentation"

export const saveIndexCount = createAsyncThunk(
  "presentation/saveIndexCount",
  async ({ id, indexCount }) => {
    return await presentationService.saveIndexCountApi(id, indexCount)
  }
)
