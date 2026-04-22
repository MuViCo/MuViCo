/**
 * Redux store configuration
 * This file sets up the Redux store for the application using Redux Toolkit's configureStore. 
 * It combines reducers, including the presentationReducer, to manage the state of the presentation. 
 * The store is then exported for use in the application.
 */
import { configureStore } from "@reduxjs/toolkit"
import presentationReducer from "./presentationReducer"

const store = configureStore({
  reducer: {
    presentation: presentationReducer,
  },
})

export default store