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
  InputGroup,
  InputRightElement,
  IconButton,
} from "@chakra-ui/react"
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons"
import Error from "../utils/Error"
import authService from "../../services/auth"


import {
  minPwLength,
  maxPwLength,
  invalidPwCharRegex,
  minUsernameLength,
  maxUsernameLength,
  usernameAllowedCharsRegex,
  usernameStartEndRegex,
  usernameConsecutiveSpecialsRegex,
} from "../../../constants.js"

const initialValues = {
  username: "",
  password: "",
  password_confirmation: "",
}

const validationSchema = yup.object().shape({
  username: yup
    .string()
    .trim()
    .required("Username is required")
    .min(minUsernameLength, `Username must be at least ${minUsernameLength} characters`)
    .max(maxUsernameLength, `Username can be at most ${maxUsernameLength} characters`)
    .matches(
      usernameAllowedCharsRegex,
      "Username can only contain letters, numbers, dots, underscores, and hyphens"
    )
    .matches(
      usernameStartEndRegex,
      "Username must start and end with a letter or number"
    )
    .test(
      "username-no-consecutive-specials",
      "Username cannot contain consecutive special characters",
      (value) => !value || !usernameConsecutiveSpecialsRegex.test(value)
    ),
  password: yup
    .string()
    .required("Password is required")
    .min(minPwLength, `Password must be at least ${minPwLength} characters`)
    .max(maxPwLength, `Password must be at most ${maxPwLength} characters`)
    .test(
      "password-not-whitespace-only",
      "Password cannot contain only spaces",
      (value) => !value || value.trim().length > 0
    )
    .test(
      "allowed-password-characters",
      "Password contains unsupported characters",
      (value) => !value || !invalidPwCharRegex.test(value)
    ),
  password_confirmation: yup
    .string()
    .oneOf([yup.ref("password"), null], "Passwords must match")
    .required("Password confirmation is required"),
})

export const SignUpForm = ({ onSubmit, error, handleTermsClick }) => {
  const [formData, setFormData] = useState(initialValues)
  const [formErrors, setFormErrors] = useState({})
  const [showPasswords, setShowPasswords] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const usernameRef = useRef(null)
  const passwordRef = useRef(null)
  const passwordagainRef = useRef(null)
  const submitButtonRef = useRef(null)
  const termsRef = useRef(null)
  const usernameCheckTimeoutRef = useRef(null)
  const usernameCheckRequestIdRef = useRef(0)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    setFormErrors((prevErrors) => {
      if (!prevErrors[name]) {
        return prevErrors
      }

      const nextErrors = { ...prevErrors }
      delete nextErrors[name]
      return nextErrors
    })

    if (name !== "username") {
      return
    }

    if (usernameCheckTimeoutRef.current) {
      clearTimeout(usernameCheckTimeoutRef.current)
      usernameCheckTimeoutRef.current = null
    }

    const trimmedUsername = value.trim()
    if (
      trimmedUsername.length < minUsernameLength ||
      trimmedUsername.length > maxUsernameLength ||
      !usernameAllowedCharsRegex.test(trimmedUsername) ||
      !usernameStartEndRegex.test(trimmedUsername) ||
      usernameConsecutiveSpecialsRegex.test(trimmedUsername)
    ) {
      return
    }

    const requestId = usernameCheckRequestIdRef.current + 1
    usernameCheckRequestIdRef.current = requestId

    usernameCheckTimeoutRef.current = setTimeout(async () => {
      try {
        const { available } = await authService.checkUsernameAvailability(value)

        if (requestId !== usernameCheckRequestIdRef.current) {
          return
        }

        setFormErrors((prevErrors) => {
          const nextErrors = { ...prevErrors }

          if (!available) {
            nextErrors.username = "Username already exists"
          } else if (nextErrors.username === "Username already exists") {
            delete nextErrors.username
          }

          return nextErrors
        })
      } catch {
        // Ignore realtime availability errors to keep typing experience smooth.
      }
    }, 350)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await validationSchema.validate(formData, { abortEarly: false })

      const { available } = await authService.checkUsernameAvailability(
        formData.username
      )
      if (!available) {
        setFormErrors((prevErrors) => ({
          ...prevErrors,
          username: "Username already exists",
        }))
        return
      }

      setIsSubmitting(true)
      await onSubmit(formData)
    } catch (validationErrors) {
      if (validationErrors?.name === "ValidationError") {
        const errors = {}
        validationErrors.inner.forEach((validationError) => {
          errors[validationError.path] = validationError.message
        })
        setFormErrors(errors)
      }
    } finally {
      setIsSubmitting(false)
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
          <InputGroup>
            <Input
              id="password_signup"
              data-testid="password_signup"
              type={showPasswords ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              ref={passwordRef}
              onKeyDown={handleKeyDown}
            />
            <InputRightElement>
              <IconButton
                aria-label={showPasswords ? "Hide password" : "Show password"}
                icon={showPasswords ? <ViewOffIcon /> : <ViewIcon />}
                onClick={() => setShowPasswords(!showPasswords)}
                variant="ghost"
                size="sm"
                tabIndex={-1}
              />
            </InputRightElement>
          </InputGroup>
          {formErrors.password && <Error error={formErrors.password} />}
        </FormControl>

        <FormControl mt={4}>
          <FormLabel htmlFor="password_confirmation">
            Confirm Password
          </FormLabel>
          <InputGroup>
            <Input
              id="password_confirmation_signup"
              data-testid="password_signup_confirmation"
              type={showPasswords ? "text" : "password"}
              name="password_confirmation"
              placeholder="Password_confirmation"
              value={formData.password_confirmation}
              onChange={handleChange}
              ref={passwordagainRef}
              onKeyDown={handleKeyDown}
            />
            <InputRightElement>
              <IconButton
                aria-label={showPasswords ? "Hide password" : "Show password"}
                icon={showPasswords ? <ViewOffIcon /> : <ViewIcon />}
                onClick={() => setShowPasswords(!showPasswords)}
                variant="ghost"
                size="sm"
                tabIndex={-1}
              />
            </InputRightElement>
          </InputGroup>
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
            isLoading={isSubmitting}
            loadingText="Signing up"
            isDisabled={isSubmitting}
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
      await authService.signup({ username, password })
      const loggedInUser = await authService.login({ username, password })
      onSignup(loggedInUser)
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
