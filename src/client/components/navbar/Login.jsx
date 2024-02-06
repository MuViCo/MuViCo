import { Form, Formik, Field } from "formik"
import { Form as BootstrapForm, Button } from "react-bootstrap"

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

const Login = ({ handleLogin }) => {
  const onSubmit = (values) => {
    handleLogin(values.username, values.password)
  }

  return (
    <Formik initialValues={initialValues} onSubmit={onSubmit}>
      {() => <LoginForm />}
    </Formik>
  )
}

export default Login
