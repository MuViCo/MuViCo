import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import GoogleSignInButton from '../../components/presentation/GoogleSignInButton'
import { signInWithPopup } from 'firebase/auth'
import axios from 'axios'


jest.mock('firebase/auth', () => ({
  signInWithPopup: jest.fn(),
  GoogleAuthProvider: jest.fn(),
}))

jest.mock('../../components/utils/firebase', () => ({
    apikey: 'testkey'
    }))

jest.mock("axios")

describe('GoogleSignInButton', () => {
  test('renders Google Sign-In button', () => {
    render(<GoogleSignInButton onLogin={jest.fn()} />)
    expect(screen.getByText('Sign in with Google')).toBeInTheDocument()
  })

  test('calls onLogin with user data when Google sign-in is successful', async () => {
    const mockOnLogin = jest.fn()

    const mockUser = {
      getIdToken: jest.fn().mockResolvedValue("test-id-token"),
    }
    require("firebase/auth").signInWithPopup.mockResolvedValue({
      user: mockUser,
    })

    axios.post.mockResolvedValue({
      data: { username: "testuser", email: "test@example.com" },
    })

    render(<GoogleSignInButton onLogin={mockOnLogin} />)

    fireEvent.click(screen.getByText("Sign in with Google"))

    await waitFor(() => {
      expect(mockUser.getIdToken).toHaveBeenCalled()
      expect(axios.post).toHaveBeenCalledWith(
        "/api/login/firebase",
        {},
        { headers: { Authorization: `Bearer test-id-token` } }
      )
      expect(mockOnLogin).toHaveBeenCalledWith({
        username: "testuser",
        email: "test@example.com",
      })}
    )})

  test('handles error if Google sign-in fails', async () => {
    console.error = jest.fn()  
    signInWithPopup.mockRejectedValueOnce(new Error('Google sign-in error'))

    render(<GoogleSignInButton onLogin={jest.fn()} />)

    fireEvent.click(screen.getByText('Sign in with Google'))

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        'Error signing in with Google:',
        expect.any(Error)
      )
    })
  })
})
