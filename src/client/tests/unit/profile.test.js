import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import { useNavigate } from "react-router-dom"
import { useToast } from "@chakra-ui/react"

import Profile from "../../components/profilepage/profile"
import changepasswordService from "../../services/changepassword"

jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
}))

jest.mock("../../services/changepassword", () => ({
  changepassword: jest.fn(),
}))

jest.mock("@chakra-ui/react", () => {
  const originalModule = jest.requireActual("@chakra-ui/react")
  return {
    ...originalModule,
    useToast: jest.fn(),
  }
})

describe("Profile", () => {
  const user = { username: "testuser" }
  let navigateMock
  let toastMock

  beforeEach(() => {
    navigateMock = jest.fn()
    toastMock = jest.fn()

    useNavigate.mockReturnValue(navigateMock)
    useToast.mockReturnValue(toastMock)
    changepasswordService.changepassword.mockReset()
  })

  test("renders profile content", () => {
    render(<Profile user={user} />)

    expect(screen.getByText("My Profile")).toBeInTheDocument()
    expect(screen.getByText("Account Information")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Change Password" })).toBeInTheDocument()
    expect(screen.getByText("testuser")).toBeInTheDocument()
  })

  test("shows required fields toast and does not call API", async () => {
    render(<Profile user={user} />)

    const submitButton = screen.getByRole("button", { name: "Confirm changes" })
    fireEvent.submit(submitButton.closest("form"))

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Error",
          description: "All fields are required",
          status: "error",
        })
      )
    })

    expect(changepasswordService.changepassword).not.toHaveBeenCalled()
  })

  test("shows mismatch toast when new passwords do not match", async () => {
    render(<Profile user={user} />)

    fireEvent.change(screen.getByTestId("current-password-input"), {
      target: { value: "current-password" },
    })
    fireEvent.change(screen.getByTestId("new-password-input"), {
      target: { value: "new-password-1" },
    })
    fireEvent.change(screen.getByTestId("confirm-password-input"), {
      target: { value: "new-password-2" },
    })

    fireEvent.click(screen.getByRole("button", { name: "Confirm changes" }))

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Error",
          description: "New passwords do not match",
          status: "error",
        })
      )
    })
    expect(changepasswordService.changepassword).not.toHaveBeenCalled()
  })

  test("toggles current password visibility with eye button", () => {
    render(<Profile user={user} />)

    const currentPasswordInput = screen.getByTestId("current-password-input")
    expect(currentPasswordInput).toHaveAttribute("type", "password")

    const eyeButtons = screen.getAllByRole("button", { name: "Show password" })
    fireEvent.click(eyeButtons[0])

    expect(currentPasswordInput).toHaveAttribute("type", "text")
    expect(screen.getByRole("button", { name: "Hide password" })).toBeInTheDocument()
  })

  test("shows minimum length validation message to user", async () => {
    render(<Profile user={user} />)

    fireEvent.change(screen.getByTestId("current-password-input"), {
      target: { value: "current-password" },
    })
    fireEvent.change(screen.getByTestId("new-password-input"), {
      target: { value: "short" },
    })
    fireEvent.change(screen.getByTestId("confirm-password-input"), {
      target: { value: "short" },
    })

    fireEvent.click(screen.getByRole("button", { name: "Confirm changes" }))

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Error",
          description: "Password must be at least 8 characters long",
          status: "error",
        })
      )
    })

    expect(changepasswordService.changepassword).not.toHaveBeenCalled()
  })

  test("submits valid form and shows success toast", async () => {
    changepasswordService.changepassword.mockResolvedValue({})
    render(<Profile user={user} />)

    fireEvent.change(screen.getByTestId("current-password-input"), {
      target: { value: "current-password" },
    })
    fireEvent.change(screen.getByTestId("new-password-input"), {
      target: { value: "new-password" },
    })
    fireEvent.change(screen.getByTestId("confirm-password-input"), {
      target: { value: "new-password" },
    })

    fireEvent.click(screen.getByRole("button", { name: "Confirm changes" }))

    await waitFor(() => {
      expect(changepasswordService.changepassword).toHaveBeenCalledWith({
        currentPassword: "current-password",
        newPassword: "new-password",
      })
    })

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Success",
          description: "Password changed successfully",
          status: "success",
        })
      )
    })

    await waitFor(() => {
      expect(screen.getByTestId("current-password-input")).toHaveValue("")
      expect(screen.getByTestId("new-password-input")).toHaveValue("")
      expect(screen.getByTestId("confirm-password-input")).toHaveValue("")
    })
  })

  test("shows backend error message when API fails", async () => {
    changepasswordService.changepassword.mockRejectedValue({
      response: { data: { error: "Invalid current password" } },
    })

    render(<Profile user={user} />)

    fireEvent.change(screen.getByTestId("current-password-input"), {
      target: { value: "wrong-current-password" },
    })
    fireEvent.change(screen.getByTestId("new-password-input"), {
      target: { value: "new-password" },
    })
    fireEvent.change(screen.getByTestId("confirm-password-input"), {
      target: { value: "new-password" },
    })

    fireEvent.click(screen.getByRole("button", { name: "Confirm changes" }))

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Error",
          description: "Invalid current password",
          status: "error",
        })
      )
    })
  })

  test("navigates to frontpage when return button is clicked", () => {
    render(<Profile user={user} />)

    fireEvent.click(screen.getByRole("button", { name: "Return to Frontpage" }))

    expect(navigateMock).toHaveBeenCalledWith("/")
  })
})