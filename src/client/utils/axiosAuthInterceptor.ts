/*
 * On a 401 with code: "SESSION_EXPIRED", tries a silent refresh + retry
 * before broadcasting "session-expired" (see src/server/utils/middleware.js).
 */
import axios from "axios"
import authService from "../services/auth"

import type {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios"
import type { AuthUser } from "../types"

/** The error body the server sends alongside a 401. */
interface SessionExpiredBody {
  code?: string
}

/**
 * axios has no field for "we already retried this one", so the interceptor
 * stores its own flag on the outgoing config object.
 */
type RetryableConfig = InternalAxiosRequestConfig & {
  retriedAfterRefresh?: boolean
}

export const SESSION_EXPIRED_MESSAGE =
  "Your session has expired. Please log in again."

// Used to broadcast a detected session expiry to the rest of the app
export const SESSION_EXPIRED_EVENT = "session-expired"

// Shares one in-flight refresh across requests that 401 at the same time.
let refreshPromise: Promise<AuthUser> | null = null

const refreshOnce = (): Promise<AuthUser> => {
  if (!refreshPromise) {
    refreshPromise = authService.refreshAccessToken().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

export const handleResponseError = async (
  error: AxiosError<SessionExpiredBody>
): Promise<AxiosResponse> => {
  if (error.response?.data?.code !== "SESSION_EXPIRED") {
    return Promise.reject(error)
  }

  const originalRequest = error.config as RetryableConfig | undefined

  // retriedAfterRefresh caps retries at one, avoiding an infinite loop.
  if (originalRequest && !originalRequest.retriedAfterRefresh) {
    originalRequest.retriedAfterRefresh = true

    try {
      const refreshedUser = await refreshOnce()
      return axios({
        ...originalRequest,
        headers: {
          ...originalRequest.headers,
          Authorization: `Bearer ${refreshedUser.token}`,
        },
      })
    } catch {
      // refresh failed too - fall through to a real session expiry
    }
  }

  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT))
  return Promise.reject(error)
}

export const setupAxiosAuthInterceptor = (): void => {
  axios.interceptors.response.use((response) => response, handleResponseError)
}
