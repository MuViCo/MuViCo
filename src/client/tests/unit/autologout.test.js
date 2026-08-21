/*
 * Auto-logout unit tests.
 * Verifies that an expired token clears the user state and redirects to home,
 * both at initial mount (a token that was already dead before the app loaded)
 * and reactively mid-session (the axios interceptor detecting a token that
 * died while the user was already using the app).
 */
import { act } from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import "@testing-library/jest-dom"
import { useToast } from "@chakra-ui/react"
import NavBar from "../../components/navbar/index"
import { isTokenExpired } from "../../auth"
import authService from "../../services/auth"
import { SESSION_EXPIRED_EVENT } from "../../utils/axiosAuthInterceptor"

jest.mock("../../auth")
jest.mock("../../services/auth", () => ({
  __esModule: true,
  default: {
    refreshAccessToken: jest.fn(),
    logout: jest.fn().mockResolvedValue(undefined),
  },
}))
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
}))
jest.mock("../../components/utils/firebase", () => ({
  apikey: "testkey",
}))
jest.mock("@chakra-ui/react", () => {
  const originalModule = jest.requireActual("@chakra-ui/react")
  return {
    ...originalModule,
    useToast: jest.fn(),
  }
})
jest.mock("../../components/navbar/Login", () => {
  const React = require("react")
  return function MockLogin({ onLogin }) {
    return (
      <button
        type="button"
        data-testid="mock-login-trigger"
        onClick={() => onLogin({ id: 1, username: "login-user" })}
      >
        Trigger Login
      </button>
    )
  }
})

describe("autologout", () => {
  beforeEach(() => {
    authService.refreshAccessToken.mockReset()
  })

  test("user is logged out when token expires and the silent refresh also fails", async () => {
    const setUser = jest.fn()
    const navigate = jest.fn()

    isTokenExpired.mockReturnValue(true)
    authService.refreshAccessToken.mockRejectedValue(
      new Error("no valid refresh token")
    )
    require("react-router-dom").useNavigate.mockReturnValue(navigate)

    render(
      <MemoryRouter>
        <NavBar
          user={{ username: "testuser" }}
          setUser={setUser}
          navigate={navigate}
        />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(setUser).toHaveBeenCalledWith(null)
      expect(navigate).toHaveBeenCalledWith("/")
    })
  })

  test("user stays logged in when the access token looks expired but the silent refresh succeeds", async () => {
    // Covers the common real-world case: the access token (1h) expired while
    // the browser was closed, but the httpOnly refresh cookie (7 days) is
    // still valid, so the user shouldn't be bounced back to logged-out.
    const setUser = jest.fn()
    const navigate = jest.fn()
    const refreshedUser = { username: "testuser", token: "new-access-token" }

    isTokenExpired.mockReturnValue(true)
    authService.refreshAccessToken.mockResolvedValue(refreshedUser)
    require("react-router-dom").useNavigate.mockReturnValue(navigate)

    render(
      <MemoryRouter>
        <NavBar
          user={{ username: "testuser" }}
          setUser={setUser}
          navigate={navigate}
        />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(setUser).toHaveBeenCalledWith(refreshedUser)
    })
    expect(setUser).not.toHaveBeenCalledWith(null)
    expect(navigate).not.toHaveBeenCalledWith("/")
  })
})

describe("session-expired event", () => {
  test("clears user, redirects home, and shows a toast when session-expired fires", async () => {
    const setUser = jest.fn()
    const navigate = jest.fn()
    const toastMock = jest.fn()

    isTokenExpired.mockReturnValue(false)
    require("react-router-dom").useNavigate.mockReturnValue(navigate)
    useToast.mockReturnValue(toastMock)

    render(
      <MemoryRouter>
        <NavBar user={{ username: "testuser" }} setUser={setUser} />
      </MemoryRouter>
    )

    act(() => {
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT))
    })

    await waitFor(() => {
      expect(setUser).toHaveBeenCalledWith(null)
      expect(navigate).toHaveBeenCalledWith("/")
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "warning",
          description: expect.stringMatching(/session has expired/i),
        })
      )
    })
  })

  test("only reacts once to a burst of session-expired events fired back-to-back", async () => {
    // Simulates e.g. EditMode's Promise.all batch of updateCue calls: if the
    // token dies mid-batch, every parallel request 401s and independently
    // dispatches session-expired. That shouldn't stack multiple toasts/redirects.
    const setUser = jest.fn()
    const navigate = jest.fn()
    const toastMock = jest.fn()

    isTokenExpired.mockReturnValue(false)
    require("react-router-dom").useNavigate.mockReturnValue(navigate)
    useToast.mockReturnValue(toastMock)

    render(
      <MemoryRouter>
        <NavBar user={{ username: "testuser" }} setUser={setUser} />
      </MemoryRouter>
    )

    act(() => {
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT))
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT))
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT))
    })

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledTimes(1)
    })
    expect(setUser).toHaveBeenCalledTimes(1)
    expect(navigate).toHaveBeenCalledTimes(1)
  })

  test("reacts again to a new session-expired event after logging back in", async () => {
    const setUser = jest.fn()
    const navigate = jest.fn()
    const toastMock = jest.fn()

    isTokenExpired.mockReturnValue(false)
    require("react-router-dom").useNavigate.mockReturnValue(navigate)
    useToast.mockReturnValue(toastMock)

    render(
      <MemoryRouter>
        <NavBar user={null} setUser={setUser} />
      </MemoryRouter>
    )

    act(() => {
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT))
    })
    await waitFor(() => expect(toastMock).toHaveBeenCalledTimes(1))

    fireEvent.click(screen.getByRole("button", { name: "Login" }))
    fireEvent.click(screen.getByTestId("mock-login-trigger"))

    act(() => {
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT))
    })

    await waitFor(() => expect(toastMock).toHaveBeenCalledTimes(2))
  })
})
