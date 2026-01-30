import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import userEvent from "@testing-library/user-event"

import { SignUpForm } from "../../components/navbar/SignUp"
import { describe } from "node:test"

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
})

describe("HandleKeyDown", () => {
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
    render(<SignUpForm onSubmit={onSubmit} />)
    const termsLink = screen.getByTestId("terms_link")
    const submitButton = screen.getByTestId("signup_inform")

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
    expect(termsLink).toBeInTheDocument()

    await userEvent.click(termsLink)
    expect(handleTermsClick).toHaveBeenCalledTimes(1)
  })

  test("handleKeyDown shifts focus correctly to username from submit button", () => {
    const onSubmit = jest.fn()
    const { getByPlaceholderText, getByTestId } = render(
      <SignUpForm onSubmit={onSubmit} />
    )
    const submitButton = getByTestId("signup_inform")
    const usernameInput = getByPlaceholderText("Username")

    fireEvent.keyDown(submitButton, { key: "Tab" })
    expect(document.activeElement).toBe(usernameInput)
  })

  test("handleKeyDown calls handleSubmit when pressing enter when focus on password confirmation", async () => {
    const onSubmit = jest.fn()
    const { getByTestId } = render(<SignUpForm onSubmit={onSubmit} />)
    const usernameInput = getByTestId("username_signup")
    const passwordInput = getByTestId("password_signup")
    const passwordAgainInput = getByTestId("password_signup_confirmation")

    fireEvent.change(usernameInput, { target: { value: "testuser" } })
    fireEvent.change(passwordInput, { target: { value: "testpassword" } })
    fireEvent.change(passwordAgainInput, { target: { value: "testpassword" } })

    fireEvent.keyDown(passwordAgainInput, { key: "Enter" })

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1)
      expect(onSubmit).toHaveBeenCalledWith({
        username: "testuser",
        password: "testpassword",
        password_confirmation: "testpassword",
      })
    })
  })

  test("handleKeyDown calls handleSubmit when pressing enter when focus on submit button", async () => {
    const onSubmit = jest.fn()
    const { getByTestId } = render(<SignUpForm onSubmit={onSubmit} />)
    const usernameInput = getByTestId("username_signup")
    const passwordInput = getByTestId("password_signup")
    const passwordAgainInput = getByTestId("password_signup_confirmation")
    const submitButton = getByTestId("signup_inform")

    fireEvent.change(usernameInput, { target: { value: "testuser" } })
    fireEvent.change(passwordInput, { target: { value: "testpassword" } })
    fireEvent.change(passwordAgainInput, { target: { value: "testpassword" } })

    fireEvent.keyDown(submitButton, { key: "Enter" })

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1)
      expect(onSubmit).toHaveBeenCalledWith({
        username: "testuser",
        password: "testpassword",
        password_confirmation: "testpassword",
      })
    })
  })
})

describe("Password visibility toggle", () => {
  test("renders password visibility toggle buttons", () => {
    const onSubmit = jest.fn()
    render(<SignUpForm onSubmit={onSubmit} />)

    const showButtons = screen.getAllByLabelText("Show password")
    expect(showButtons).toHaveLength(2)
  })

  test("password input is hidden by default", () => {
    const onSubmit = jest.fn()
    const { getByTestId } = render(<SignUpForm onSubmit={onSubmit} />)
    const passwordInput = getByTestId("password_signup")
    expect(passwordInput).toHaveAttribute("type", "password")
  })

  test("password confirmation input is hidden by default", () => {
    const onSubmit = jest.fn()
    const { getByTestId } = render(<SignUpForm onSubmit={onSubmit} />)
    const passwordConfirmInput = getByTestId("password_signup_confirmation")
    expect(passwordConfirmInput).toHaveAttribute("type", "password")
  })

  test("clicking show password button makes both password fields visible", async () => {
    const onSubmit = jest.fn()
    const { getByTestId, getAllByLabelText } = render(
      <SignUpForm onSubmit={onSubmit} />
    )
    const passwordInput = getByTestId("password_signup")
    const passwordConfirmInput = getByTestId("password_signup_confirmation")

    const showButtons = getAllByLabelText("Show password")

    // Click the first button (on password field)
    fireEvent.click(showButtons[0])

    await waitFor(() => {
      expect(passwordInput).toHaveAttribute("type", "text")
      expect(passwordConfirmInput).toHaveAttribute("type", "text")
    })
  })

  test("clicking show password button again hides both password fields", async () => {
    const onSubmit = jest.fn()
    const { getByTestId, getAllByLabelText } = render(
      <SignUpForm onSubmit={onSubmit} />
    )
    const passwordInput = getByTestId("password_signup")
    const passwordConfirmInput = getByTestId("password_signup_confirmation")

    const showButtons = getAllByLabelText("Show password")
    fireEvent.click(showButtons[0])

    await waitFor(() => {
      expect(passwordInput).toHaveAttribute("type", "text")
    })

    const hideButtons = getAllByLabelText("Hide password")
    fireEvent.click(hideButtons[0])

    await waitFor(() => {
      expect(passwordInput).toHaveAttribute("type", "password")
      expect(passwordConfirmInput).toHaveAttribute("type", "password")
    })
  })

  test("both password toggle buttons toggle the same state", async () => {
    const onSubmit = jest.fn()
    const { getByTestId, getAllByLabelText } = render(
      <SignUpForm onSubmit={onSubmit} />
    )
    const passwordInput = getByTestId("password_signup")

    // Click second button (on password confirmation field)
    const showButtons = getAllByLabelText("Show password")
    fireEvent.click(showButtons[1])

    await waitFor(() => {
      expect(passwordInput).toHaveAttribute("type", "text")
    })
  })
})
