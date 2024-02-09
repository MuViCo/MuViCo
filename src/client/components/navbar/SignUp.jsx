import { Form, Formik, Field, ErrorMessage } from "formik"
import { Form as BootstrapForm, Button } from "react-bootstrap"
import { useState } from "react"
import * as yup from "yup"

import signupService from "../../services/signup"
import loginService from "../../services/login"
import Error from "./Error"
import presentationService from "../../services/presentations"

const initialValues = {
  username: "",
  password: "",
  password_confirmation: "",
}

const validationSchema = yup.object().shape({
  username: yup.string().required("Username is required"),
  password: yup.string().required("Password is required"),
  password_confirmation: yup
    .string()
    .oneOf([yup.ref("password"), null], "Passwords must match")
    .required("Password confirmation is required"),
})

const SignUpForm = () => (
  <Form>
    <BootstrapForm.Group>
      <BootstrapForm.Label>Username</BootstrapForm.Label>
      <Field
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
      <BootstrapForm.Label>Password</BootstrapForm.Label>
      <Field
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
      <BootstrapForm.Label>Confirm Password</BootstrapForm.Label>
      <Field
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

    <br />
    <Button variant="primary" type="submit">
      Submit
    </Button>
  </Form>
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

  return (
    <>
      <Formik
        initialValues={initialValues}
        onSubmit={onSubmit}
        validationSchema={validationSchema}
      >
        {() => <SignUpForm />}
      </Formik>
      <Error error={error} />
    </>
  )
}

export default SignUp
