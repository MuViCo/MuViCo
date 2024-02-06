import { Form, Formik, Field, ErrorMessage } from "formik"
import { Form as BootstrapForm, Button } from "react-bootstrap"
import * as yup from "yup"

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

const SignUp = ({ handleSignup }) => {
  const onSubmit = (values) => {
    handleSignup(values.username, values.password)
  }

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={onSubmit}
      validationSchema={validationSchema}
    >
      {() => <SignUpForm />}
    </Formik>
  )
}

export default SignUp
