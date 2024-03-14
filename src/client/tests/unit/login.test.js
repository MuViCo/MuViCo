import React from "react"
import {
  render, screen, fireEvent, waitFor,
} from "@testing-library/react"
import "@testing-library/jest-dom"
import { LoginForm } from "../../components/navbar/Login"

describe("Login", () => {
  test("renders content", () => {
    const onSubmit = jest.fn()
    render(<LoginForm onSubmit={onSubmit} />)
    expect(screen.getByText("Username")).toBeDefined()
    expect(screen.getByText("Password")).toBeDefined()
    expect(screen.getByText("Submit")).toBeDefined()
  })

  it("submits the form with provided values", async () => {
    const onSubmit = jest.fn()
    const { getByLabelText, getByText } = render(
      <LoginForm onSubmit={onSubmit} />,
    )

    fireEvent.change(getByLabelText("Username"), {
      target: { value: "testuser" },
    })
    fireEvent.change(getByLabelText("Password"), {
      target: { value: "testpassword" },
    })

    fireEvent.submit(getByText("Submit"))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        { username: "testuser", password: "testpassword" },
        expect.anything(),
      )
    })
  })
})
