import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import * as yup from "yup"
import {
  Container,
  Box,
  Link,
  Button,
  FormControl,
  FormLabel,
  Input,
} from "@chakra-ui/react"
import Error from "../utils/Error"
import signupService from "../../services/signup"
import loginService from "../../services/login"

const initialValues = {
  username: "",
  password: "",
  password_confirmation: "",
}

const validationSchema = yup.object().shape({
  username: yup
    .string()
    .required("Username is required")
    .min(3, "Username must be at least 3 characters"),
  password: yup
    .string()
    .required("Password is required")
    .min(3, "Password must be at least 3 characters"),
  password_confirmation: yup
    .string()
    .oneOf([yup.ref("password"), null], "Passwords must match")
    .required("Password confirmation is required"),
})

export const SignUpForm = ({ onSubmit, error, handleTermsClick }) => {
  const [formData, setFormData] = useState(initialValues)
  const [formErrors, setFormErrors] = useState({})
  const usernameRef = useRef(null)
  const passwordRef = useRef(null)
  const passwordagainRef = useRef(null)
  const submitButtonRef = useRef(null)
  const termsRef = useRef(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await validationSchema.validate(formData, { abortEarly: false })
      await onSubmit(formData)
    } catch (validationErrors) {
      const errors = {}
      validationErrors.inner.forEach((validationError) => {
        errors[validationError.path] = validationError.message
      })
      setFormErrors(errors)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault()
      if (e.target === usernameRef.current) {
        passwordRef.current.focus()
      } else if (e.target === passwordRef.current) {
        passwordagainRef.current.focus()
      } else if (e.target === passwordagainRef.current) {
        if (e.key === "Tab") {
          termsRef.current.focus()
        } else {
          handleSubmit(e)
        }
      } else if (e.target === termsRef.current) {
        if (e.key === "Tab") {
          submitButtonRef.current.focus()
        } else {
          handleTermsClick()
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

  return (
    <>
      <form onSubmit={handleSubmit}>
        <FormControl>
          <FormLabel htmlFor="username">Username</FormLabel>
          <Input
            id="username_signup"
            data-testid="username_signup"
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            ref={usernameRef}
            onKeyDown={handleKeyDown}
          />
          {formErrors.username && <Error error={formErrors.username} />}
        </FormControl>

        <FormControl mt={4}>
          <FormLabel htmlFor="password">Password</FormLabel>
          <Input
            id="password_signup"
            data-testid="password_signup"
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            ref={passwordRef}
            onKeyDown={handleKeyDown}
          />
          {formErrors.password && <Error error={formErrors.password} />}
        </FormControl>

        <FormControl mt={4}>
          <FormLabel htmlFor="password_confirmation">
            Confirm Password
          </FormLabel>
          <Input
            id="password_confirmation_signup"
            data-testid="password_signup_confirmation"
            type="password"
            name="password_confirmation"
            placeholder="Password_confirmation"
            value={formData.password_confirmation}
            onChange={handleChange}
            ref={passwordagainRef}
            onKeyDown={handleKeyDown}
          />
          {formErrors.password_confirmation && (
            <Error error={formErrors.password_confirmation} />
          )}
        </FormControl>

        <Container mt={0}>
          <Box fontSize={12}>
            <p>
              By clicking Sign up, you agree to our{" "}
              <Link
                color="purple.200"
                ref={termsRef}
                onClick={handleTermsClick}
                style={{ cursor: "pointer" }}
                onKeyDown={handleKeyDown}
                data-testid="terms_link"
                tabIndex={0}
              >
                Terms of Service
              </Link>
            </p>
          </Box>
        </Container>

        <Box mt={-2} mb={-2} display="flex" justifyContent="flex-start">
          <Button
            data-testid="signup_inform"
            colorScheme="purple"
            type="submit"
            ref={submitButtonRef}
            onKeyDown={handleKeyDown}
            mt={3}
          >
            Sign up
          </Button>
        </Box>
      </form>
      <Error error={error} />
    </>
  )
}
const SignUp = ({ onSignup }) => {
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleTermsClick = () => {
    navigate("/terms")
  }
  const onSubmit = async ({ username, password }) => {
    try {
      await signupService.signup({ username, password })
      const user = await loginService.login({ username, password })
      const userJSON = JSON.stringify(user)
      window.localStorage.setItem("user", userJSON)
      onSignup(userJSON)
    } catch (e) {
      setError(e.response.data.error)
    }
  }

  return (
    <SignUpForm
      onSubmit={onSubmit}
      error={error}
      handleTermsClick={handleTermsClick}
    />
  )
}

export default SignUp
