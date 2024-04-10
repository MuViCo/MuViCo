import { Link, useNavigate } from "react-router-dom" // Add useNavigate
import {
  Container,
  Box,
  Heading,
  Flex,
  Button,
  Menu,
  Tooltip,
  MenuButton,
  MenuList,
  Text,
  Container,
  Box,
  Heading,
  Flex,
  Button,
  Menu,
  Tooltip,
  MenuButton,
  MenuList,
  Text,
} from "@chakra-ui/react"
import ThemeToggleButton from "./theme-toggle-button"
import Login from "./Login"
import SignUp from "./SignUp"

const NavBar = ({ user, setUser }) => {
  const navigate = useNavigate() // Define navigate function
  const navigate = useNavigate() // Define navigate function

  const onLogin = (userJSON) => {
    setUser(userJSON)
    navigate("/home")
  }
  const onLogin = (userJSON) => {
    setUser(userJSON)
    navigate("/home")
  }

  const onSignup = (userJSON) => {
    setUser(userJSON)
    navigate("/home")
  }
  const onSignup = (userJSON) => {
    setUser(userJSON)
    navigate("/home")
  }

  const handleLogout = () => {
    window.localStorage.removeItem("user")
    setUser(null)
    navigate("/")
  }
  const handleLogout = () => {
    window.localStorage.removeItem("user")
    setUser(null)
    navigate("/")
  }

  return (
    <Box
      position="fixed"
      as="nav"
      w="100%"
      style={{ backdropFilter: "blur(10px)", zIndex: 1000, top: 0 }}
    >
      <Container
        display="flex"
        p={4}
        maxW="container.lg"
        wrap="wrap"
        align="center"
        justify="space-between"
      >
        <Flex align="center" mr={7}>
          <Tooltip label="to Frontpage" aria-label="A tooltip">
            <Heading as="h3" size="lg" letterSpacing={"tighter"}>
              <Link to={"/home"} style={{ position: "relative" }}>
                <Text as="span" color="inherit">
                  MuViCo
                </Text>
                <Text
                  as="span"
                  position="absolute"
                  bottom="-2px"
                  left="0"
                  w="100%"
                  h="1px"
                  bg="teal.500"
                />
              </Link>
            </Heading>
          </Tooltip>
        </Flex>
        <Box flex={3} align="right">
          <ThemeToggleButton />
          {user && (
            <Box ml={4} display={{ base: "inline-block" }}>
              <Button colorScheme="teal" variant="ghost" onClick={handleLogout}>
                Logout
              </Button>
            </Box>
          )}
          {!user && (
            <>
              <Box ml={4} display={{ base: "inline-block" }}>
                <Menu>
                  <MenuButton as={Button} colorScheme="teal" variant="outline">
                    Login
                  </MenuButton>
                  <MenuList>
                    <Box p={2}>
                      <Login onLogin={onLogin} />
                    </Box>
                  </MenuList>
                </Menu>
              </Box>
              <Box ml={4} display={{ base: "inline-block" }}>
                <Menu>
                  <MenuButton as={Button} colorScheme="teal">
                    Sign Up
                  </MenuButton>
                  <MenuList>
                    <Box p={2}>
                      <SignUp onSignup={onSignup} />
                    </Box>
                  </MenuList>
                </Menu>
              </Box>
            </>
          )}
        </Box>
      </Container>
    </Box>
  )
}

export default NavBar
