import { Form, Formik, Field } from "formik"
import { Form as BootstrapForm, Button } from "react-bootstrap"
import { useState } from "react"
import presentationService from "../../services/presentations"

import loginService from "../../services/login"
import Error from "./Error"

const initialValues = {
  username: "",
  password: "",
}

const LoginForm = () => (
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
    <BootstrapForm.Group>
      <BootstrapForm.Label>Password</BootstrapForm.Label>
      <Field
        type="password"
        name="password"
        placeholder="Username"
        as={BootstrapForm.Control}
      />
    </BootstrapForm.Group>
    <br />
    <Button variant="primary" type="submit">
      Submit
    </Button>
  </Form>
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

  return (
    <>
      <Formik initialValues={initialValues} onSubmit={onSubmit}>
        {() => <LoginForm />}
      </Formik>
      <Error error={error} />
    </>
  )
}

export default Login
