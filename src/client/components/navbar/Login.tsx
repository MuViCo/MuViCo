/**
 * Login component for the MuViCo application.
 * Provides a form for users to log in with their username and password.
 * Also includes a Google Sign-In button for alternative authentication.
 * Displays error messages for invalid input or failed login attempts.
 */

import { useState, useRef } from "react"
import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Container,
  Box,
} from "@chakra-ui/react"
import authService from "../../services/auth"
import Error from "../utils/Error"
import GoogleSignInButton from "../presentation/GoogleSignInButton"

import type {
  ChangeEvent,
  FormEvent,
  KeyboardEvent as ReactKeyboardEvent,
} from "react"
import type { AuthUser, Credentials } from "../../types"

interface LoginFormProps {
  onSubmit: (credentials: Credentials) => Promise<void>
  error?: string | null
  /** Passed straight through to GoogleSignInButton as well. */
  onLogin: (user: AuthUser) => void
}

const initialValues: Credentials = {
  username: "",
  password: "",
}

export const LoginForm = ({ onSubmit, error, onLogin }: LoginFormProps) => {
  const [formData, setFormData] = useState(initialValues)
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const usernameRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const submitButtonRef = useRef<HTMLButtonElement>(null)

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!formData.username && !formData.password) {
      setSubmissionError("Username and password required")
      return
    }

    if (!formData.username) {
      setSubmissionError("Username required")
      return
    }

    if (!formData.password) {
      setSubmissionError("Password required")
      return
    }

    try {
      await onSubmit(formData)
    } catch (err) {
      setSubmissionError(err.response.data.error)
    }
  }

  // Handle Enter and Tab key navigation between form fields and submission
  // Refs are asserted rather than optionally chained: every branch below is
  // reached from a keydown on one of these very inputs, so they are mounted.
  const handleKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault()
      if (e.target === usernameRef.current) {
        passwordRef.current!.focus()
      } else if (e.target === passwordRef.current) {
        if (e.key === "Tab") {
          submitButtonRef.current!.focus()
        } else if (e.key === "Enter") {
          handleSubmit(e)
        }
      } else if (e.target === submitButtonRef.current) {
        if (e.key === "Tab") {
          usernameRef.current!.focus()
        } else {
          handleSubmit(e)
        }
      }
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <FormControl>
          <FormLabel htmlFor="username">Username</FormLabel>
          <Input
            id="username"
            data-testid="username_login"
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            ref={usernameRef}
            onKeyDown={handleKeyDown}
          />
        </FormControl>
        <FormControl mt={4} mb={0}>
          <FormLabel htmlFor="password">Password</FormLabel>
          <Input
            id="password"
            data-testid="password_login"
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            ref={passwordRef}
            onKeyDown={handleKeyDown}
          />
          <Error error={submissionError || error} />{" "}
        </FormControl>
        <Container mt={4}>
          <Box textAlign="justify"></Box>
        </Container>
        <Box
          mt={4}
          mb={-2}
          display="flex"
          gap={4}
          justifyContent="flex-start"
          alignItems="center"
        >
          <Button
            data-testid="login_inform"
            colorScheme="purple"
            type="submit"
            ref={submitButtonRef}
            onKeyDown={handleKeyDown}
          >
            Log in
          </Button>
          <GoogleSignInButton onLogin={onLogin} />
        </Box>
      </form>
    </>
  )
}

const Login = ({ onLogin }: { onLogin: (user: AuthUser) => void }) => {
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async ({ username, password }: Credentials) => {
    try {
      const user = await authService.login({ username, password })
      window.localStorage.setItem("user", JSON.stringify(user))
      onLogin(user)
    } catch (err) {
      console.log(err)
      setError(err.response.data.error)
      throw err
    }
  }

  return (
    <div>
      <LoginForm onSubmit={onSubmit} error={error} onLogin={onLogin} />
    </div>
  )
}

export default Login
