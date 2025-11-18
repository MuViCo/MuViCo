import { Link, useNavigate, useLocation } from "react-router-dom"
import { useEffect, useState } from "react"
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
  IconButton,
  usePrefersReducedMotion,
  useColorMode,
} from "@chakra-ui/react"
import { keyframes } from "@emotion/react"
import { QuestionIcon } from "@chakra-ui/icons"
import { motion } from "framer-motion"
import ThemeToggleButton from "./theme-toggle-button"
import Login from "./Login"
import SignUp from "./SignUp"
import getToken from "../../auth"
import { isTokenExpired } from "../../auth"
import UserManualModal from "./UserManualModal"

const NavBar = ({ user, setUser }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [isManualOpen, setIsManualOpen] = useState(false)
  const [highlight, setHighlight] = useState(false)

  const isHomepage = location.pathname === "/home"
  const isPresentationPage = location.pathname.startsWith("/presentation")
  const prefersReducedMotion = usePrefersReducedMotion()

  const { colorMode } = useColorMode()

  const pulse = colorMode === "dark"
  ? keyframes`
    0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.5); }
    70% { box-shadow: 0 0 0 10px rgba(255, 255, 255, 0); }
    100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
  `
  : keyframes`
    0% { box-shadow: 0 0 0 0 rgba(128, 90, 213, 0.5); }
    70% { box-shadow: 0 0 0 10px rgba(128, 90, 213, 0); }
    100% { box-shadow: 0 0 0 0 rgba(128, 90, 213, 0); }
  `

  const animation = prefersReducedMotion
    ? undefined
    : `${pulse} 2s infinite`

  const handleLogout = (navigate, setUser) => {
    window.localStorage.removeItem("user")
    window.localStorage.removeItem("driveAccessToken")
    setUser(null)
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

  const handleOpenManual = () => {
    const key = isHomepage
      ? "hasSeenHelp_homepage"
      : "hasSeenHelp_presentation"

    localStorage.setItem(key, "true")
    setHighlight(false)
    setIsManualOpen(true)
  }

  // Check token expiration
  useEffect(() => {
    const token = getToken()
    if (isTokenExpired(token)) {
      handleLogout(navigate, setUser)
    }
  }, []) //run only once


  useEffect(() => {
    // Unique key depending on the page
    const key = isHomepage
      ? "hasSeenHelp_homepage"
      : "hasSeenHelp_presentation"

    const hasSeen = localStorage.getItem(key)

    if (!hasSeen) {
      setHighlight(true) // show highlight on first visit
    }
  }, [isHomepage, isPresentationPage])

  return (
    <>
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
          <motion.div
            whileHover={{ scale: 1.05 }}
            onHoverStart={(e) => {}}
            onHoverEnd={(e) => {}}
          >
            <Flex align="center" mr={7}>
              <Tooltip label="to Frontpage" aria-label="A tooltip">
                <Heading
                  id="navbar-title"
                  as="h3"
                  size="lg"
                  letterSpacing={"tighter"}
                  fontWeight={600}
                  fontFamily={"'Poppins', sans-serif"}
                  style={{ WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale" }}
                >
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
                      bg="purple.200"
                    />
                  </Link>
                </Heading>
              </Tooltip>
            </Flex>
          </motion.div>
          <Box flex={3} align="right">
            <ThemeToggleButton />
            {user && (
              <>
                <Box ml={4} display={{ base: "inline-block" }}>
                  <Button
                    colorScheme="purple"
                    variant="ghost"
                    fontWeight={600}
                    fontFamily={"'Poppins', sans-serif"}
                    style={{ WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale" }}
                    onClick={() => {
                      setTimeout(() => handleLogout(navigate, setUser), 0) // Trigger logout after current render cycle
                    }}
                  >
                    Logout
                  </Button>
                </Box>
                {(isHomepage || isPresentationPage) && (
                  <Box ml={4} display="inline-block" position="relative">
                    <IconButton
                      variant="ghost"
                      size="lg"
                      colorScheme="purple"
                      icon={<QuestionIcon />}
                      title="Help"
                      onClick={handleOpenManual}
                      animation={highlight ? animation : "none"}
                      borderRadius="full"
                      transition="transform 0.2s ease"
                      className="help-button"
                    ></IconButton>
                    {/* TutorialGuide will present a guided highlight/tooltip pointing to this button */}
                  </Box>
                )}
              </>
            )}
            {!user && (
              <>
                <Box ml={4} display={{ base: "inline-block" }}>
                  <Menu>
                    <MenuButton
                      as={Button}
                      colorScheme="purple"
                      variant="outline"
                    >
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
                    <MenuButton as={Button} colorScheme="purple">
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
      <UserManualModal
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
        isHomepage={isHomepage}
        isPresentationPage={isPresentationPage}
      />
    </>
  )
}

export default NavBar
