import { Dropdown } from "react-bootstrap"
import { useState } from "react"
import ThemeToggleButton from "./theme-toggle-button"
import {
  Container,
  Box,
  Stack,
  Heading,
  Flex,
  Menu,
  MenuItem,
  MenuList,
  MenuButton,
  IconButton,
  useColorModeValue,
  Button,
} from "@chakra-ui/react"
import Login from "./Login"
import SignUp from "./SignUp"
import signupService from "../../services/signup"
import loginService from "../../services/login"

const ColorSchemesExample = () => {
  const [user, setUser] = useState(null)

  const handleLogin = async (username, password) => {
    try {
      const user = await loginService.login({ username, password })
      setUser(user)
    } catch (e) {
      console.log(e)
    }
  }

  console.log(user)

  const handleSignup = async (username, password) => {
    try {
      const user = await signupService.signup({ username, password })
      setUser(user)
    } catch (e) {
      console.log(e)
    }
  }

  return (
    <Box
      position="fixed"
      as="nav"
      w="101%"
      bg={useColorModeValue("#ffffff42", "#20202380")}
      style={{ backdropFilter: "blur(12px)", zIndex: 1000, top: 0 }}
    >
      <Container
        display="flex"
        p={4}
        maxW="container.md"
        wrap="wrap"
        align="center"
        justify="space-between"
      >
        <Flex align="center" mr={7}>
          <Heading as="h3" size="lg" letterSpacing={"tighter"}>
            MuViCo
          </Heading>
        </Flex>
        <Box flex={3} align="right">
          <ThemeToggleButton />
          {user && (
            <Box ml={4} display={{ base: "inline-block" }}>
              <Button colorScheme="red" onClick={() => setUser(null)}>
                Logout
              </Button>
            </Box>
          )}
          {!user && (
            <>
              <Box ml={4} display={{ base: "inline-block" }}>
                <Dropdown>
                  <Dropdown.Toggle
                    variant="success"
                    style={{ backgroundColor: "red" }}
                  >
                    Login
                  </Dropdown.Toggle>
                  <Dropdown.Menu style={{ padding: ".76rem", width: "300px" }}>
                    <Login handleLogin={handleLogin} />
                  </Dropdown.Menu>
                </Dropdown>
              </Box>
              <Box ml={4} display={{ base: "inline-block" }}>
                <Dropdown>
                  <Dropdown.Toggle
                    variant="success"
                    style={{ backgroundColor: "red" }}
                  >
                    SignUp
                  </Dropdown.Toggle>
                  <Dropdown.Menu style={{ padding: ".76rem", width: "300px" }}>
                    <SignUp handleSignup={handleSignup} />
                  </Dropdown.Menu>
                </Dropdown>
              </Box>
            </>
          )}
        </Box>
      </Container>
    </Box>
  )
}

export default ColorSchemesExample
