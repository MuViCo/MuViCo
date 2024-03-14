import {
  Form, Formik, Field, ErrorMessage,
} from "formik"
import { Form as BootstrapForm, Button } from "react-bootstrap"
import { useState } from "react"
import * as yup from "yup"
import { Container, Box, Link } from "@chakra-ui/react"
import Error from "./Error"
import signupService from "../../services/signup"
import loginService from "../../services/login"
import presentationService from "../../services/presentations"

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

export const SignUpForm = ({ onSubmit, error }) => (
  <>
    <Formik
      initialValues={initialValues}
      onSubmit={onSubmit}
      validationSchema={validationSchema}
    >
      {({ handleSubmit }) => (
        <Form>
          <BootstrapForm.Group>
            <BootstrapForm.Label htmlFor="username">
              Username
            </BootstrapForm.Label>
            <Field
              id="username"
              type="text"
              name="username"
              placeholder="Username"
              as={BootstrapForm.Control}
            />
          </BootstrapForm.Group>
          <ErrorMessage
            name="username"
            component="div"
            className="alert alert-danger"
          />
          <BootstrapForm.Group>
            <BootstrapForm.Label htmlFor="password">
              Password
            </BootstrapForm.Label>
            <Field
              id="password"
              type="password"
              name="password"
              placeholder="Password"
              as={BootstrapForm.Control}
            />
          </BootstrapForm.Group>
          <ErrorMessage
            name="password"
            component="div"
            className="alert alert-danger"
          />

          <BootstrapForm.Group>
            <BootstrapForm.Label htmlFor="password_confirmation">
              Confirm Password
            </BootstrapForm.Label>
            <Field
              id="password_confirmation"
              type="password"
              name="password_confirmation"
              placeholder="Password"
              as={BootstrapForm.Control}
            />
          </BootstrapForm.Group>
          <ErrorMessage
            name="password_confirmation"
            component="div"
            className="alert alert-danger"
          />
        <Container>
            <Box textAlign="justify">
              <p>
              By clicking Submit, you agree to our {""}
              <Link color='teal.500' href='/terms' isExternal>
                Terms of Service
              </Link>
              </p>
            </Box>
          </Container>

          <br />
          <Button variant="primary" type="submit">
            Submit
          </Button>
        </Form>
      )}
    </Formik>
    <Error error={error} />
  </>
)

const SignUp = ({ onSignup }) => {
  const [error, setError] = useState(null)

  const onSubmit = async ({ username, password }) => {
    try {
      await signupService.signup({ username, password })
      const user = await loginService.login({ username, password })
      const userJSON = JSON.stringify(user)
      window.localStorage.setItem("user", userJSON)
      presentationService.setToken(user.token)
      onSignup(userJSON)
    } catch (e) {
      console.log(e)
      setError(e.response.data.error)
    }
  }

  return <SignUpForm onSubmit={onSubmit} error={error} />
}

export default SignUp
