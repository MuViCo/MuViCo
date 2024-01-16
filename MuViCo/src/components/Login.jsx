import { Form, Formik, useField, Field } from "formik";

const initialValues = {
    username: '',
    password: ''
}

const LoginForm = ({onSubmit}) => {
    const [usernameField] = useField('username')
    const [passwordField] = useField('password')
    return (
    <>
    <Form>
        <Field type='text' name='username' placeholder='Username'/>
        <Field type='password' name='password' placeholder='Password'/>
        <button type='submit' text='login'>Login</button>
    </Form>
    </>
    )
}

const Login = () => {
    const onSubmit = (values) => {
        console.log(values.username,values.password)
    }
    return(
        <div>
            <Formik initialValues={initialValues} onSubmit={onSubmit}>
                {({handleSubmit}) => <LoginForm onSubmit={handleSubmit}/>}
            </Formik>
        </div>
    )
}

export default Login