/*
 * Detects an expired/invalid app session from any axios response and
 * notifies the rest of the app via a "session-expired" window event,
 * without touching every individual service call site.
 *
 * Only requests that already carried an Authorization header are treated
 * this way - the login/signup endpoints also return 401 for bad
 * credentials, and those requests are unauthenticated, so they must be
 * left for the calling form to handle locally.
 */
import axios from "axios"

export const SESSION_EXPIRED_MESSAGE =
  "Your session has expired. Please log in again."

const hasAuthorizationHeader = (headers) => {
  if (!headers) return false
  if (typeof headers.get === "function") {
    return Boolean(headers.get("Authorization"))
  }
  return Boolean(headers.Authorization || headers.authorization)
}

export const handleResponseError = (error) => {
  const isAuthFailure = error.response?.status === 401
  const wasAuthenticatedRequest = hasAuthorizationHeader(error.config?.headers)

  if (isAuthFailure && wasAuthenticatedRequest) {
    window.dispatchEvent(new CustomEvent("session-expired"))
  }

  return Promise.reject(error)
}

export const setupAxiosAuthInterceptor = () => {
  axios.interceptors.response.use((response) => response, handleResponseError)
}
