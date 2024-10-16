import { configureStore } from "@reduxjs/toolkit"
import presentationReducer from "./presentationReducer"

const store = configureStore({
  reducer: {
    presentation: presentationReducer,
  },
})

export default store