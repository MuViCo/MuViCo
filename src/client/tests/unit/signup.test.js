import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom"
import userEvent from "@testing-library/user-event"

import { SignUpForm } from "../../components/navbar/SignUp"

describe("SignUp", () => {
  test("renders content", () => {
    const onSubmit = jest.fn()
    render(<SignUpForm onSubmit={onSubmit} />)
    expect(screen.getByText("Username")).toBeDefined()
    expect(screen.getByText("Password")).toBeDefined()
    expect(screen.getByText("Confirm Password")).toBeDefined()
    expect(screen.getByText("Sign up")).toBeDefined()
  })
  test("submits the form with provided values", async () => {
    const onSubmit = jest.fn()
    render(<SignUpForm onSubmit={onSubmit} />)
    await userEvent.type(screen.getByPlaceholderText("Username"), "testuser")
    await userEvent.type(
      screen.getByPlaceholderText("Password"),
      "testpassword"
    )
    await userEvent.type(
      screen.getByPlaceholderText("Password_confirmation"),
      "testpassword"
    )
    await userEvent.click(screen.getByText("Sign up"))
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith({
      username: "testuser",
      password: "testpassword",
      password_confirmation: "testpassword",
    })
  })
  test("shows error message when username is too short", async () => {
    const onSubmit = jest.fn()
    render(<SignUpForm onSubmit={onSubmit} />)
    await userEvent.type(screen.getByPlaceholderText("Username"), "te")
    await userEvent.click(screen.getByText("Sign up"))
    expect(
      screen.getByText("Username must be at least 3 characters")
    ).toBeDefined()
  })
  test("shows error message when password is too short", async () => {
    const onSubmit = jest.fn()
    render(<SignUpForm onSubmit={onSubmit} />)
    await userEvent.type(screen.getByPlaceholderText("Password"), "te")
    await userEvent.click(screen.getByText("Sign up"))
    expect(
      screen.getByText("Password must be at least 3 characters")
    ).toBeDefined()
  })
  test("shows error message when password confirmation does not match", async () => {
    const onSubmit = jest.fn()
    render(<SignUpForm onSubmit={onSubmit} />)
    await userEvent.type(
      screen.getByPlaceholderText("Password"),
      "testpassword"
    )
    await userEvent.type(
      screen.getByPlaceholderText("Password_confirmation"),
      "testpassword2"
    )
    await userEvent.click(screen.getByText("Sign up"))
    expect(screen.getByText("Passwords must match")).toBeDefined()
  })

  test("handleKeyDown shifts focus correctly", () => {
    const onSubmit = jest.fn()
    const { getByPlaceholderText } = render(<SignUpForm onSubmit={onSubmit} />)
    const usernameInput = getByPlaceholderText("Username")
    const passwordInput = getByPlaceholderText("Password")
    const passwordAgainInput = getByPlaceholderText("Password_confirmation")

    fireEvent.keyDown(usernameInput, { key: "Tab" })
    expect(document.activeElement).toBe(passwordInput)

    fireEvent.keyDown(passwordInput, { key: "Tab" })
    expect(document.activeElement).toBe(passwordAgainInput)
  })

  test("handleKeyDown shifts focus to terms link and enter calls function correctly", () => {
    const onSubmit = jest.fn()
    const handleTermsClick = jest.fn()
    const { getByPlaceholderText } = render(
      <SignUpForm onSubmit={onSubmit} handleTermsClick={handleTermsClick} />
    )
    const usernameInput = getByPlaceholderText("Username")
    const passwordInput = getByPlaceholderText("Password")
    const passwordAgainInput = getByPlaceholderText("Password_confirmation")
    const termsLink = screen.getByTestId("terms_link")

    fireEvent.keyDown(usernameInput, { key: "Tab" })
    expect(document.activeElement).toBe(passwordInput)

    fireEvent.keyDown(passwordInput, { key: "Tab" })
    expect(document.activeElement).toBe(passwordAgainInput)

    fireEvent.keyDown(passwordAgainInput, { key: "Tab" })
    expect(document.activeElement).toBe(termsLink)

    fireEvent.keyDown(termsLink, { key: "Enter" })
    expect(handleTermsClick).toHaveBeenCalledTimes(1)
  })

  test("handleKeyDown shifts focus correctly to submit button", () => {
    const onSubmit = jest.fn()
    const { getByPlaceholderText } = render(<SignUpForm onSubmit={onSubmit} />)
    const usernameInput = getByPlaceholderText("Username")
    const passwordInput = getByPlaceholderText("Password")
    const passwordAgainInput = getByPlaceholderText("Password_confirmation")
    const termsLink = screen.getByTestId("terms_link")
    const submitButton = screen.getByTestId("signup_inform")

    fireEvent.keyDown(usernameInput, { key: "Tab" })
    expect(document.activeElement).toBe(passwordInput)

    fireEvent.keyDown(passwordInput, { key: "Tab" })
    expect(document.activeElement).toBe(passwordAgainInput)

    fireEvent.keyDown(passwordAgainInput, { key: "Tab" })
    expect(document.activeElement).toBe(termsLink)

    fireEvent.keyDown(termsLink, { key: "Tab" })
    expect(document.activeElement).toBe(submitButton)
  })

  test("handleTermsClick is called when terms link is clicked", async () => {
    const onSubmit = jest.fn()
    const handleTermsClick = jest.fn()
    render(
      <SignUpForm onSubmit={onSubmit} handleTermsClick={handleTermsClick} />
    )
    const termsLink = screen.getByTestId("terms_link")

    // Assert that the terms link is present
    expect(termsLink).toBeInTheDocument()
    await userEvent.click(termsLink)
    expect(handleTermsClick).toHaveBeenCalledTimes(1)
  })
})
