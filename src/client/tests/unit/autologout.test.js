/*
 * Auto-logout unit tests.
 * Verifies that an expired token clears the user state and redirects to home,
 * both at initial mount (a token that was already dead before the app loaded)
 * and reactively mid-session (the axios interceptor detecting a token that
 * died while the user was already using the app).
 */
import { act } from "react"
import { render, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import "@testing-library/jest-dom"
import { useToast } from "@chakra-ui/react"
import NavBar from "../../components/navbar/index"
import { isTokenExpired } from "../../auth"

jest.mock("../../auth")
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

describe("autologout", () => {
  test("user is logged out when token expires", async () => {
    const setUser = jest.fn()
    const navigate = jest.fn()

    isTokenExpired.mockReturnValue(true)
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
      window.dispatchEvent(new CustomEvent("session-expired"))
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
})
