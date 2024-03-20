import { useState } from "react"
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
import Error from "./Error"
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

export const SignUpForm = ({ onSubmit, error }) => {
  const [formData, setFormData] = useState(initialValues)
  const [formErrors, setFormErrors] = useState({})

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
      validationErrors.inner.forEach((problemosss) => {
        errors[error.path] = error.message
      })
      setFormErrors(errors)
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
          />
          {formErrors.username && (
            <div className="alert alert-danger">{formErrors.username}</div>
          )}
        </FormControl>

        <FormControl mt={4}>
          <FormLabel htmlFor="password">Password</FormLabel>
          <Input
            id="password"
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
          />
          {formErrors.password && (
            <div className="alert alert-danger">{formErrors.password}</div>
          )}
        </FormControl>

        <FormControl mt={4}>
          <FormLabel htmlFor="password_confirmation">
            Confirm Password
          </FormLabel>
          <Input
            id="password_confirmation"
            type="password"
            name="password_confirmation"
            placeholder="Password"
            value={formData.password_confirmation}
            onChange={handleChange}
          />
          {formErrors.password_confirmation && (
            <div className="alert alert-danger">
              {formErrors.password_confirmation}
            </div>
          )}
        </FormControl>

        <Container mt={4}>
          <Box textAlign="justify">
            <p>
              By clicking Submit, you agree to our{" "}
              <Link color="teal.500" href="/terms" isExternal>
                Terms of Service
              </Link>
            </p>
          </Box>
        </Container>

        <Box mt={0} display="flex" justifyContent="flex-start">
          <Button colorScheme="teal" type="submit">
            Submit
          </Button>
        </Box>
      </form>
      <Error error={error} />
    </>
  )
}

const SignUp = ({ onSignup }) => {
  const [error, setError] = useState(null)

  const onSubmit = async ({ username, password }) => {
    try {
      await signupService.signup({ username, password })
      const user = await loginService.login({ username, password })
      const userJSON = JSON.stringify(user)
      window.localStorage.setItem("user", userJSON)
      onSignup(userJSON)
    } catch (e) {
      console.log(e)
      setError(e.response.data.error)
    }
  }

  return <SignUpForm onSubmit={onSubmit} error={error} />
}

export default SignUp
