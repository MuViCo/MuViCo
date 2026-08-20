/*
 * Logout behavior unit tests for NavBar.
 * Verifies logout control rendering and user state reset when logging out.
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import "@testing-library/jest-dom"
import NavBar from "../../components/navbar/index"
import authService from "../../services/auth"

jest.mock("../../components/utils/firebase", () => ({
  apikey: "testkey",
}))

// NavBar silently tries to refresh the access token on mount whenever it
// looks expired (no real token exists in these tests' localStorage). Resolve
// it so that background attempt doesn't also call setUser(null) and
// interfere with the logout-button assertions below.
jest.mock("../../services/auth", () => ({
  __esModule: true,
  default: {
    refreshAccessToken: jest.fn().mockResolvedValue({ username: "testuser" }),
    logout: jest.fn().mockResolvedValue(undefined),
  },
}))

describe("logout", () => {
  test("render content", () => {
    const setUser = jest.fn()
    render(
      <MemoryRouter>
        <NavBar user={{ username: "testuser" }} setUser={setUser} />
      </MemoryRouter>
    )
    expect(screen.getByText("Logout")).toBeDefined()
  })

  test("handleLogout", async () => {
    // Core logout contract: active user is cleared from app state, and the
    // server-side refresh token is invalidated (best-effort).
    const navigate = jest.fn()
    const setUser = jest.fn()

    const { getByText } = render(
      <MemoryRouter>
        <NavBar
          user={{ username: "testuser" }}
          setUser={setUser}
          navigate={navigate}
        />
      </MemoryRouter>
    )
    const logoutButton = getByText("Logout")

    fireEvent.click(logoutButton)

    await waitFor(() => {
      expect(setUser).toHaveBeenCalledWith(null)
    })
    expect(authService.logout).toHaveBeenCalled()
  })
})
