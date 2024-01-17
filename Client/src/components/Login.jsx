import { Form, Formik, Field } from "formik";

const initialValues = {
  username: "",
  password: "",
};

const LoginForm = () => (
  <Form>
    <Field type="text" name="username" placeholder="Username" />
    <Field type="password" name="password" placeholder="Password" />
    <button type="submit">Login</button>
  </Form>
);

const Login = ({ handleLogin }) => {
  const onSubmit = (values) => {
    console.log(values.username, values.password);
    handleLogin(values.username, values.password);
  };
  return (
    <div>
      <Formik initialValues={initialValues} onSubmit={onSubmit}>
        {() => <LoginForm />}
      </Formik>
    </div>
  );
};

export default Login;
