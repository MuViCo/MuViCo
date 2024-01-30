import Container from "react-bootstrap/Container"
import Navbar from "react-bootstrap/Navbar"
import { Dropdown } from "react-bootstrap"

import Login from "./Login"
import loginService from "../../services/login"

const ColorSchemesExample = () => {
  const handleLogin = async (username, password) => {
    try {
      const user = await loginService.login({ username, password })
      console.log(user)
    } catch (e) {
      console.log(e)
    }
  }
  return (
    <>
      <Navbar bg="dark" data-bs-theme="dark">
        <Container>
          <Navbar.Brand>MuViCo</Navbar.Brand>
          <Dropdown>
            <Dropdown.Toggle
              variant="success"
              style={{ backgroundColor: "red" }}
            >
              Login
            </Dropdown.Toggle>
            <Dropdown.Menu style={{ padding: ".75rem", width: "300px" }}>
              <Login handleLogin={handleLogin} />
            </Dropdown.Menu>
          </Dropdown>
        </Container>
      </Navbar>
    </>
  )
}

export default ColorSchemesExample
