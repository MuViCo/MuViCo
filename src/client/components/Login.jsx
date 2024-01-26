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
    handleLogin(values.username, values.password);
  };
  const pageStyle = {
    textAlign: "center",
    backgroundColor: "blue",
    maxWidth: "50em",
  };
  const bodystyle = {
    margin: "auto",
    maxWidth: "100em",
    fontFamily: "'Helvetica','Arial','sans-serif'",
    backgroundColor: "green",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  };
    

  return (
    <div style={bodystyle}>
      <div style={pageStyle}>
        <h1>MuViCo</h1>
        <p>MuviCo is a multimodal application designed to provide versatile visual elements and support functions for live music performances.The purpose of the application is to bring an additional dimension to music experiences that can complement and enrich the experience for both listeners and performers.The program is browser-based and intended to operate on computers.
The application displays lyrics, images, or AI-generated visuals to enhance the musical experience. Additionally, it reflects the lyrics to support the singer. All performances can be pre-planned or guided in real-time."
        </p>

        <Formik initialValues={initialValues} onSubmit={onSubmit}>
          {() => <LoginForm />}
        </Formik>
      
      </div>
    </div>
  );
};

export default Login;
