import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import { LoginForm } from "../../components/navbar/Login"
import { describe } from "node:test"

jest.mock("../../components/utils/firebase", () => ({
  apikey: "testkey",
}))

describe("Login", () => {
  test("renders content", () => {
    const onSubmit = jest.fn()
    render(<LoginForm onSubmit={onSubmit} />)
    expect(screen.getByText("Username")).toBeDefined()
    expect(screen.getByText("Password")).toBeDefined()
    expect(screen.getByText("Log in")).toBeDefined()
  })

  it("submits the form with provided values", async () => {
    const onSubmit = jest.fn()
    const { getByLabelText, getByText } = render(
      <LoginForm onSubmit={onSubmit} />
    )

    fireEvent.change(getByLabelText("Username"), {
      target: { value: "testuser" },
    })
    fireEvent.change(getByLabelText("Password"), {
      target: { value: "testpassword" },
    })

    fireEvent.submit(getByText("Log in"))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1)
      expect(onSubmit).toHaveBeenCalledWith({
        username: "testuser",
        password: "testpassword",
      })
    })
  })
  test("error message when username or password is empty", async () => {
    const onSubmit = jest.fn()
    const { getByLabelText, getByText } = render(
      <LoginForm onSubmit={onSubmit} />
    )

    fireEvent.change(getByLabelText("Username"), {
      target: { value: "" },
    })
    fireEvent.change(getByLabelText("Password"), {
      target: { value: "" },
    })

    fireEvent.click(getByText("Log in"))
    await waitFor(() => {
      expect(screen.getByText("Username and password required")).toBeDefined()
    })
  })

  test("error message when username is empty", async () => {
    const onSubmit = jest.fn()
    const { getByLabelText, getByText } = render(
      <LoginForm onSubmit={onSubmit} />
    )

    fireEvent.change(getByLabelText("Username"), {
      target: { value: "" },
    })
    fireEvent.change(getByLabelText("Password"), {
      target: { value: "testpassword" },
    })

    fireEvent.click(getByText("Log in"))
    await waitFor(() => {
      expect(screen.getByText("Username required")).toBeDefined()
    })
  })

  test("error message when password is empty", async () => {
    const onSubmit = jest.fn()
    const { getByLabelText, getByText } = render(
      <LoginForm onSubmit={onSubmit} />
    )

    fireEvent.change(getByLabelText("Username"), {
      target: { value: "testuser" },
    })
    fireEvent.change(getByLabelText("Password"), {
      target: { value: "" },
    })

    fireEvent.click(getByText("Log in"))
    await waitFor(() => {
      expect(screen.getByText("Password required")).toBeDefined()
    })
  })

  test("error message when server error", async () => {
    const mockSubmit = jest.fn().mockRejectedValue({
      response: { data: { error: "Invalid credentials" } },
    })

    const { getByLabelText, getByText } = render(
      <LoginForm onSubmit={mockSubmit} />
    )

    fireEvent.change(getByLabelText("Username"), {
      target: { value: "testuser" },
    })
    fireEvent.change(getByLabelText("Password"), {
      target: { value: "testpassword" },
    })

    fireEvent.click(getByText("Log in"))

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeDefined()
    })
  })
})

describe("HandleKeyDown", () => {
  test("handleKeyDown shifts focus correctly from username", () => {
    const onSubmit = jest.fn()
    const { getByLabelText } = render(<LoginForm onSubmit={onSubmit} />)
    const usernameInput = getByLabelText("Username")
    const passwordInput = getByLabelText("Password")

    fireEvent.keyDown(usernameInput, { key: "Tab" })
    expect(document.activeElement).toBe(passwordInput)
  })
  test("handleKeyDown shifts focus correctly from password", () => {
    const onSubmit = jest.fn()
    const { getByLabelText } = render(<LoginForm onSubmit={onSubmit} />)
    const passwordInput = getByLabelText("Password")
    const submitButton = screen.getByTestId("login_inform")

    fireEvent.keyDown(passwordInput, { key: "Tab" })
    expect(document.activeElement).toBe(submitButton)
  })
  test("handleKeyDown calls handleSubmit when pressing enter on password", () => {
    const onSubmit = jest.fn()
    const { getByLabelText } = render(<LoginForm onSubmit={onSubmit} />)
    const usernameInput = getByLabelText("Username")
    const passwordInput = getByLabelText("Password")

    fireEvent.change(usernameInput, { target: { value: "testuser" } })
    fireEvent.change(passwordInput, { target: { value: "testpassword" } })

    fireEvent.keyDown(passwordInput, { key: "Enter" })

    expect(onSubmit).toHaveBeenCalledWith({
      username: "testuser",
      password: "testpassword",
    })
  })
  test("handleKeyDown shifts focus correctly from submit", () => {
    const onSubmit = jest.fn()
    const { getByLabelText } = render(<LoginForm onSubmit={onSubmit} />)
    const usernameInput = getByLabelText("Username")
    const submitButton = screen.getByTestId("login_inform")

    fireEvent.keyDown(submitButton, { key: "Tab" })
    expect(document.activeElement).toBe(usernameInput)
  })
  test("handleKeyDown calls handleSubmit when pressing enter on submit button", () => {
    const onSubmit = jest.fn()
    const { getByLabelText } = render(<LoginForm onSubmit={onSubmit} />)
    const usernameInput = getByLabelText("Username")
    const passwordInput = getByLabelText("Password")
    const submitButton = screen.getByTestId("login_inform")

    fireEvent.change(usernameInput, { target: { value: "testuser" } })
    fireEvent.change(passwordInput, { target: { value: "testpassword" } })

    fireEvent.keyDown(submitButton, { key: "Enter" })

    expect(onSubmit).toHaveBeenCalledWith({
      username: "testuser",
      password: "testpassword",
    })
  })
})
