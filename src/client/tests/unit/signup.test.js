import React from "react"
import { render, screen } from "@testing-library/react"
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
    expect(screen.getByText("Submit")).toBeDefined()
  })
  test("submits the form with provided values", async () => {
    const onSubmit = jest.fn()
    render(<SignUpForm onSubmit={onSubmit} />)
    await userEvent.type(screen.getByLabelText("Username"), "testuser")
    await userEvent.type(screen.getByLabelText("Password"), "testpassword")
    await userEvent.type(
      screen.getByLabelText("Confirm Password"),
      "testpassword",
    )
    await userEvent.click(screen.getByText("Submit"))
    expect(onSubmit).toHaveBeenCalledWith(
      {
        username: "testuser",
        password: "testpassword",
        password_confirmation: "testpassword",
      },
      expect.anything(),
    )
  })
  test("shows error message when username is too short", async () => {
    const onSubmit = jest.fn()
    render(<SignUpForm onSubmit={onSubmit} />)
    await userEvent.type(screen.getByLabelText("Username"), "te")
    await userEvent.click(screen.getByText("Submit"))
    expect(
      screen.getByText("Username must be at least 3 characters"),
    ).toBeDefined()
  })
  test("shows error message when password is too short", async () => {
    const onSubmit = jest.fn()
    render(<SignUpForm onSubmit={onSubmit} />)
    await userEvent.type(screen.getByLabelText("Password"), "te")
    await userEvent.click(screen.getByText("Submit"))
    expect(
      screen.getByText("Password must be at least 3 characters"),
    ).toBeDefined()
  })
  test("shows error message when password confirmation does not match", async () => {
    const onSubmit = jest.fn()
    render(<SignUpForm onSubmit={onSubmit} />)
    await userEvent.type(screen.getByLabelText("Password"), "testpassword")
    await userEvent.type(
      screen.getByLabelText("Confirm Password"),
      "testpassword2",
    )
    await userEvent.click(screen.getByText("Submit"))
    expect(screen.getByText("Passwords must match")).toBeDefined()
  })
})
