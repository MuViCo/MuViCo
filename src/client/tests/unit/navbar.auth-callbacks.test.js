import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom"
import { MemoryRouter } from "react-router-dom"
import NavBar from "../../components/navbar/index"

const mockNavigate = jest.fn()

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}))

jest.mock("../../auth", () => ({
  __esModule: true,
  default: jest.fn(() => "valid-token"),
  isTokenExpired: jest.fn(() => false),
}))

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

jest.mock("../../components/navbar/SignUp", () => {
  const React = require("react")
  return function MockSignUp({ onSignup }) {
    return (
      <button
        type="button"
        data-testid="mock-signup-trigger"
        onClick={() => onSignup({ id: 2, username: "signup-user" })}
      >
        Trigger SignUp
      </button>
    )
  }
})

describe("NavBar auth callback wiring", () => {
  beforeEach(() => {
    mockNavigate.mockReset()
  })

  test("Login callback sets user and navigates to /home", () => {
    const setUser = jest.fn()

    render(
      <MemoryRouter initialEntries={["/"]}>
        <NavBar user={null} setUser={setUser} />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole("button", { name: "Login" }))
    fireEvent.click(screen.getByTestId("mock-login-trigger"))

    expect(setUser).toHaveBeenCalledWith({ id: 1, username: "login-user" })
    expect(mockNavigate).toHaveBeenCalledWith("/home")
  })

  test("SignUp callback sets user and navigates to /home", () => {
    const setUser = jest.fn()

    render(
      <MemoryRouter initialEntries={["/"]}>
        <NavBar user={null} setUser={setUser} />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole("button", { name: "Sign Up" }))
    fireEvent.click(screen.getByTestId("mock-signup-trigger"))

    expect(setUser).toHaveBeenCalledWith({ id: 2, username: "signup-user" })
    expect(mockNavigate).toHaveBeenCalledWith("/home")
  })
})
