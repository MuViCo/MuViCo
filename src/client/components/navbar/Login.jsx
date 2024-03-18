import { useState, useRef } from "react"
import {
  Button, FormControl, FormLabel, Input, Container, Box,
} from "@chakra-ui/react"
import presentationService from "../../services/presentations"
import loginService from "../../services/login"
import Error from "./Error"
import { SignUpForm } from "./SignUp"

const initialValues = {
  username: "",
  password: "",
}

export const LoginForm = ({ onSubmit, error }) => {
  const [formData, setFormData] = useState(initialValues)
  const [submissionError, setSubmissionError] = useState(null)
  const usernameRef = useRef(null)
  const passwordRef = useRef(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await onSubmit(formData)
    } catch (errorjoku) {
      console.log(error)
      setSubmissionError(error.response.data.error)
    }
  }

  const handleUsernameKeyDown = (e) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault()
      passwordRef.current.focus()
    }
  }

  const handlePasswordKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <FormControl>
          <FormLabel htmlFor="username">Username</FormLabel>
          <Input
            id="username"
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            ref={usernameRef}
            onKeyDown={handleUsernameKeyDown}
          />
        </FormControl>
        <FormControl mt={4} mb={0}>
          <FormLabel htmlFor="password">Password</FormLabel>
          <Input
            id="password"
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            ref={passwordRef}
            onKeyDown={handlePasswordKeyDown}
          />
        </FormControl>
        <Container mt={4}>
          <Box textAlign="justify">
          </Box>
        </Container>
        <Box mt={4} display="flex" justifyContent="flex-start">
          <Button colorScheme="teal" type="submit">
            Submit
          </Button>
        </Box>
      </form>
      <Error error={submissionError || error} />
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
    } catch (errorjoku) {
      console.log(error)
      setError(error.response.data.error)
      throw error
    }
  }

  return <LoginForm onSubmit={onSubmit} error={error} />
}

export default Login
