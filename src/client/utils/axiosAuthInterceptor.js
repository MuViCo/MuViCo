/*
 * Detects an expired/invalid app session from any axios response and
 * notifies the rest of the app via a "session-expired" window event,
 * without touching every individual service call site.
 *
 * The backend marks a 401 with code: "SESSION_EXPIRED" specifically when
 * the app's own JWT failed verification (see src/server/utils/middleware.js).
 */
import axios from "axios"

export const SESSION_EXPIRED_MESSAGE =
  "Your session has expired. Please log in again."

// Used to broadcast a detected session expiry to the rest of the app
export const SESSION_EXPIRED_EVENT = "session-expired"

export const handleResponseError = (error) => {
  if (error.response?.data?.code === "SESSION_EXPIRED") {
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT))
  }

  return Promise.reject(error)
}

export const setupAxiosAuthInterceptor = () => {
  axios.interceptors.response.use((response) => response, handleResponseError)
}
