import { Dropdown } from "react-bootstrap"
import ThemeToggleButton from './theme-toggle-button'
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
  useColorModeValue
} from '@chakra-ui/react'
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
    <Box position="fixed"
    as="nav"
    w="101%"
    bg={useColorModeValue('#ffffff42', '#20202380')}
    style={{backdropFilter: 'blur(12px)', zIndex: 1000, top: 0}}>
    <Container 
        display="flex" 
        p={4} 
        maxW="container.md" 
        wrap="wrap" 
        align="center"
        justify="space-between">
        <Flex align="center" mr={7}>
          <Heading as="h3" size="lg" letterSpacing={'tighter'}>
            MuViCo
          </Heading>
        </Flex>
        <Box flex={3} align="right">
          <ThemeToggleButton />
          <Box ml={4} display={{base: 'inline-block'}}>
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
          </Box>
      </Container>
    </Box>
  )
}

export default ColorSchemesExample
