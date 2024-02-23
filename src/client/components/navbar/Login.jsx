import { Form, Formik, Field } from "formik"
import { Form as BootstrapForm, Button } from "react-bootstrap"
import { useState } from "react"
import Error from "./Error"

import presentationService from "../../services/presentations"
import loginService from "../../services/login"


const initialValues = {
  username: "",
  password: "",
}

export const LoginForm = ({ onSubmit, error }) => (
  <>
    <Formik initialValues={initialValues} onSubmit={onSubmit}>
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

const Login = ({ onLogin }) => {
  const [error, setError] = useState(null)

  const onSubmit = async ({ username, password }) => {
    try {
      const user = await loginService.login({ username, password })
      //const userJSON = JSON.stringify(user)
      window.localStorage.setItem("user", JSON.stringify(user))
      console.log(user)
      presentationService.setToken(user.token)
      onLogin(JSON.stringify(user))
    } catch (e) {
      console.log(e)
      setError(e.response.data.error)
    }
  }

  return <LoginForm onSubmit={onSubmit} error={error} />
}

export default Login
