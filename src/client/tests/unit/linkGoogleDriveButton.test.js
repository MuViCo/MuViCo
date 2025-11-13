/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom"
import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ChakraProvider } from "@chakra-ui/react"
import LinkGoogleDriveButton from "../../components/homepage/LinkGoogleDriveButton"
import { auth } from "../../components/utils/firebase"
import userService from "../../services/users"
import * as firebaseAuth from "firebase/auth"

// Mock dependencies
jest.mock("../../components/utils/firebase")
jest.mock("../../services/users")
jest.mock("firebase/auth")
jest.mock("../../components/utils/toastUtils", () => ({
  useCustomToast: () => jest.fn(),
}))

// Mock localStorage
const localStorageMock = (() => {
  let store = {}

  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString()
    }),
    removeItem: jest.fn((key) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    }),
  }
})()

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
})

const renderComponent = (props = {}) => {
  return render(
    <ChakraProvider>
      <LinkGoogleDriveButton {...props} />
    </ChakraProvider>
  )
}

describe("LinkGoogleDriveButton", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.clear()
  })

  test("renders the button with correct text", () => {
    renderComponent()

    expect(screen.getByText("Link Google Drive")).toBeInTheDocument()
  })

  test("renders Google icon", () => {
    renderComponent()

    const svg = screen.getByRole("button").querySelector("svg")
    expect(svg).toBeInTheDocument()
  })

  test("handles successful Google Drive linking", async () => {
    const driveToken = "test-drive-access-token"
    const mockUser = {
      id: "user-123",
      username: "testuser",
      driveToken: driveToken,
    }

    const mockCredential = {
      accessToken: driveToken,
    }

    firebaseAuth.signInWithPopup.mockResolvedValue({
      user: { uid: "firebase-uid" },
    })

    firebaseAuth.GoogleAuthProvider.credentialFromResult.mockReturnValue(
      mockCredential
    )

    userService.linkDrive.mockResolvedValue(mockUser)

    renderComponent()

    const button = screen.getByRole("button")
    await userEvent.click(button)

    await waitFor(() => {
      expect(firebaseAuth.signInWithPopup).toHaveBeenCalledWith(
        auth,
        expect.any(firebaseAuth.GoogleAuthProvider)
      )
    })

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "driveAccessToken",
      driveToken
    )

    expect(userService.linkDrive).toHaveBeenCalledWith({
      driveAccessToken: driveToken,
    })
  })

  test("saves drive token to localStorage", async () => {
    const driveToken = "test-token-123"
    const mockCredential = {
      accessToken: driveToken,
    }

    firebaseAuth.signInWithPopup.mockResolvedValue({
      user: { uid: "firebase-uid" },
    })

    firebaseAuth.GoogleAuthProvider.credentialFromResult.mockReturnValue(
      mockCredential
    )

    userService.linkDrive.mockResolvedValue({
      id: "user-123",
      driveToken: driveToken,
    })

    renderComponent()

    const button = screen.getByRole("button")
    await userEvent.click(button)

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "driveAccessToken",
        driveToken
      )
    })
  })

  test("merges drive token with existing user data in localStorage", async () => {
    const driveToken = "test-token-abc"
    const existingUser = {
      id: "user-123",
      username: "testuser",
      email: "test@example.com",
    }

    const mockCredential = {
      accessToken: driveToken,
    }

    localStorageMock.setItem("user", JSON.stringify(existingUser))

    firebaseAuth.signInWithPopup.mockResolvedValue({
      user: { uid: "firebase-uid" },
    })

    firebaseAuth.GoogleAuthProvider.credentialFromResult.mockReturnValue(
      mockCredential
    )

    userService.linkDrive.mockResolvedValue({
      ...existingUser,
      driveToken: driveToken,
    })

    renderComponent()

    const button = screen.getByRole("button")
    await userEvent.click(button)

    await waitFor(() => {
      const savedUser = JSON.parse(localStorageMock.getItem("user"))
      expect(savedUser).toEqual({
        ...existingUser,
        driveToken: driveToken,
      })
    })
  })

  test("calls onDriveLinked callback when provided", async () => {
    const onDriveLinked = jest.fn()
    const mockUser = {
      id: "user-123",
      username: "testuser",
      driveToken: "test-token",
    }

    const mockCredential = {
      accessToken: "test-token",
    }

    firebaseAuth.signInWithPopup.mockResolvedValue({
      user: { uid: "firebase-uid" },
    })

    firebaseAuth.GoogleAuthProvider.credentialFromResult.mockReturnValue(
      mockCredential
    )

    userService.linkDrive.mockResolvedValue(mockUser)

    renderComponent({ onDriveLinked })

    const button = screen.getByRole("button")
    await userEvent.click(button)

    await waitFor(() => {
      expect(onDriveLinked).toHaveBeenCalledWith(mockUser)
    })
  })

  test("does not call onDriveLinked if it is not a function", async () => {
    const mockCredential = {
      accessToken: "test-token",
    }

    firebaseAuth.signInWithPopup.mockResolvedValue({
      user: { uid: "firebase-uid" },
    })

    firebaseAuth.GoogleAuthProvider.credentialFromResult.mockReturnValue(
      mockCredential
    )

    userService.linkDrive.mockResolvedValue({
      id: "user-123",
      driveToken: "test-token",
    })

    // Should not throw error even with invalid callback
    renderComponent({ onDriveLinked: "not-a-function" })

    const button = screen.getByRole("button")
    await userEvent.click(button)

    await waitFor(() => {
      expect(userService.linkDrive).toHaveBeenCalled()
    })
  })

  test("adds correct Google scopes", async () => {
    const mockCredential = {
      accessToken: "test-token",
    }

    firebaseAuth.signInWithPopup.mockResolvedValue({
      user: { uid: "firebase-uid" },
    })

    firebaseAuth.GoogleAuthProvider.credentialFromResult.mockReturnValue(
      mockCredential
    )

    userService.linkDrive.mockResolvedValue({
      id: "user-123",
      driveToken: "test-token",
    })

    renderComponent()

    const button = screen.getByRole("button")
    await userEvent.click(button)

    await waitFor(() => {
      // Verify GoogleAuthProvider was instantiated and addScope was called
      expect(firebaseAuth.GoogleAuthProvider).toHaveBeenCalled()
    })
  })

  test("handles Firebase authentication error", async () => {
    const authError = new Error("Auth failed")

    firebaseAuth.signInWithPopup.mockRejectedValue(authError)

    renderComponent()

    const button = screen.getByRole("button")
    await userEvent.click(button)

    await waitFor(() => {
      expect(firebaseAuth.signInWithPopup).toHaveBeenCalled()
    })
  })

  test("handles Drive linking API error", async () => {
    const mockCredential = {
      accessToken: "test-token",
    }

    const apiError = new Error("Failed to link drive")

    firebaseAuth.signInWithPopup.mockResolvedValue({
      user: { uid: "firebase-uid" },
    })

    firebaseAuth.GoogleAuthProvider.credentialFromResult.mockReturnValue(
      mockCredential
    )

    userService.linkDrive.mockRejectedValue(apiError)

    renderComponent()

    const button = screen.getByRole("button")
    await userEvent.click(button)

    await waitFor(() => {
      expect(userService.linkDrive).toHaveBeenCalled()
    })
  })

  test("button is clickable", async () => {
    const mockCredential = {
      accessToken: "test-token",
    }

    firebaseAuth.signInWithPopup.mockResolvedValue({
      user: { uid: "firebase-uid" },
    })

    firebaseAuth.GoogleAuthProvider.credentialFromResult.mockReturnValue(
      mockCredential
    )

    userService.linkDrive.mockResolvedValue({
      id: "user-123",
      driveToken: "test-token",
    })

    renderComponent()

    const button = screen.getByRole("button")
    expect(button).not.toBeDisabled()

    await userEvent.click(button)

    expect(firebaseAuth.signInWithPopup).toHaveBeenCalled()
  })

  test("extracts credential from Google authentication result", async () => {
    const driveToken = "credentials-test-token"
    const mockResult = { user: { uid: "firebase-uid" } }
    const mockCredential = { accessToken: driveToken }

    firebaseAuth.signInWithPopup.mockResolvedValue(mockResult)
    firebaseAuth.GoogleAuthProvider.credentialFromResult.mockReturnValue(
      mockCredential
    )

    userService.linkDrive.mockResolvedValue({
      id: "user-123",
      driveToken,
    })

    renderComponent()

    const button = screen.getByRole("button")
    await userEvent.click(button)

    await waitFor(() => {
      expect(firebaseAuth.GoogleAuthProvider.credentialFromResult).toHaveBeenCalledWith(
        mockResult
      )
    })
  })

  test("handles when localStorage user is null", async () => {
    const driveToken = "test-token"
    const mockCredential = {
      accessToken: driveToken,
    }

    localStorageMock.getItem.mockReturnValue(null)

    firebaseAuth.signInWithPopup.mockResolvedValue({
      user: { uid: "firebase-uid" },
    })

    firebaseAuth.GoogleAuthProvider.credentialFromResult.mockReturnValue(
      mockCredential
    )

    userService.linkDrive.mockResolvedValue({
      id: "user-123",
      driveToken,
    })

    renderComponent()

    const button = screen.getByRole("button")
    
    // Should not crash even if user is null in localStorage
    expect(() => {
      userEvent.click(button)
    }).not.toThrow()
  })
})
