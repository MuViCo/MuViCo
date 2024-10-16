import { useState, useRef } from "react"
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google"
import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Container,
  Box,
} from "@chakra-ui/react"
import loginService from "../../services/login"
import Error from "./Error"
import axios from "axios"



const initialValues = {
  username: "",
  password: "",
}

export const LoginForm = ({ onSubmit, error }) => {
  const [formData, setFormData] = useState(initialValues)
  const [submissionError, setSubmissionError] = useState(null)
  const usernameRef = useRef(null)
  const passwordRef = useRef(null)
  const submitButtonRef = useRef(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e) => {
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
      console.log(err)
      setSubmissionError(err.response.data.error)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault()
      if (e.target === usernameRef.current) {
        passwordRef.current.focus()
      } else if (e.target === passwordRef.current) {
        if (e.key === "Tab") {
          submitButtonRef.current.focus()
        } else if (e.key === "Enter") {
          handleSubmit(e)
        }
      } else if (e.target === submitButtonRef.current) {
        if (e.key === "Tab") {
          usernameRef.current.focus()
        } else {
          handleSubmit(e)
        }
      }
    }
  }
  
  const handleGoogleSuccess = async (response) => {
    const { credential } = response
    try {
      const res = await axios.post("/api/login/auth/google", { tokenId: credential })
      const { token, username, name } = res.data
      // Save the token and user info to local storage or state
      localStorage.setItem("token", token)
      localStorage.setItem("username", username)
      localStorage.setItem("name", name)
      // Redirect or update the UI as necessary
    } catch (error) {
      console.error("Google login error:", error)
    }
  }
  

  const handleGoogleFailure = (error) => {
    console.error("Google login failed:", error)
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
        <Box mt={4} mb={-2} display="flex" justifyContent="flex-start">
          <Button
            data-testid="login_inform"
            colorScheme="purple"
            type="submit"
            ref={submitButtonRef}
            onKeyDown={handleKeyDown}
          >
            Log in
          </Button>
          {submissionError && <Error message={submissionError} />}
          <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleFailure}
          />
        </GoogleOAuthProvider>
        </Box>
      </form>
    </>
  )
}

const Login = ({ onLogin }) => {
  const [error, setError] = useState(null)

  const onSubmit = async ({ username, password }) => {
    try {
      const user = await loginService.login({ username, password })
      window.localStorage.setItem("user", JSON.stringify(user))
      onLogin(user)
    } catch (err) {
      console.log(err)
      setError(err.response.data.error)
      throw err
    }
  }

  return  <LoginForm onSubmit={onSubmit} error={error} />
} 

export default Login
