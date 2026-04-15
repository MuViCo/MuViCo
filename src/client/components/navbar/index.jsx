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
import hyLogo from "../../public/hy_logo.svg"
import bHyLogo from "../../public/b_hy_logo.svg"
import getToken from "../../auth"
import { isTokenExpired } from "../../auth"
import UserManualModal from "./UserManualModal"

const NavBar = ({ user, setUser, topOffset = 40 }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [isManualOpen, setIsManualOpen] = useState(false)
  const [highlight, setHighlight] = useState(false)

  const isFrontpage = location.pathname === "/"
  const isHomepage = location.pathname === "/home"
  const isPresentationPage = location.pathname.startsWith("/presentation")
  const prefersReducedMotion = usePrefersReducedMotion()

  const { colorMode } = useColorMode()

  const navBackground = colorMode === "light"
    ? "rgba(255, 255, 255, 0.96)"
    : isPresentationPage
      ? "rgba(3, 0, 0, 0.8)"
      : "rgba(23, 25, 35, 0.82)"

  const navBorderBottom = colorMode === "light"
    ? "1px solid rgba(0, 0, 0, 0.08)"
    : "1px solid rgba(255, 255, 255, 0.08)"

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

  const navbarLogo = colorMode === "dark" ? hyLogo : bHyLogo

  const handleLogout = (navigate, setUser) => {
    window.localStorage.removeItem("user")
    window.localStorage.removeItem("driveAccessToken")
    setUser(null)
    navigate("/")
  }
  const onLogin = (user) => {
    setUser(user)
    navigate("/home")
  }

  const onSignup = (user) => {
    setUser(user)
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        borderBottom={navBorderBottom}
        style={{
          backdropFilter: isPresentationPage ? "none" : "blur(10px)",
          zIndex: 1000,
          top: `${topOffset}px`,
        }}
      >
        <Container
          display="flex"
          p={4}
          maxW="100%"
          wrap="wrap"
          align="center"
          justify="space-between"
          background={navBackground}
        >

            <Flex as={motion.div} whileHover={{ scale: 1.05 }}onHoverStart={(e) => {}} onHoverEnd={(e) => {}}align="center" mr={7} gap={6}>
              <Tooltip label="to Frontpage" aria-label="A tooltip">
                <Heading
                  as="h3"
                  size="lg"
                  letterSpacing={"tighter"}
                  fontWeight={600}
                  fontFamily={"'Poppins', sans-serif"}
                  style={{ WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale" }}
                >
                  <Link to={"/"} style={{ position: "relative" }}>
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
            <Flex as={motion.div} whileHover={{ scale: 1.05 }}onHoverStart={(e) => {}} onHoverEnd={(e) => {}}align="center" mr={7} gap={6}>
              { user && (
              <Tooltip label="to Homepage" aria-label="A tooltip">
                <Heading
                  as="h3"
                  size="lg"
                  letterSpacing={"tighter"}
                  fontWeight={600}
                  fontFamily={"'Poppins', sans-serif"}
                  style={{ WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale" }}
                >
                  <Link to={"/home"} id="navbar-presentations-link" style={{ position: "relative" }}>
                    <Text as="span" color="inherit">
                      Presentations
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
            )}
            </Flex>
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
                <Box ml={4} display={{ base: "inline-block" }}>
                  <Link to="/profile">
                    <Button colorScheme="purple" variant="ghost">
                      Profile
                    </Button>
                  </Link>
                </Box>

                {(isFrontpage || isHomepage || isPresentationPage) && (
                  <Box ml={4} display="inline-block" position="relative">
                    <IconButton
                      className="help-button"
                      variant="ghost"
                      size="lg"
                      colorScheme="purple"
                      icon={<QuestionIcon />}
                      title="Help"
                      onClick={handleOpenManual}
                      animation={highlight ? animation : "none"}
                      borderRadius="full"
                      transition="transform 0.2s ease"
                    ></IconButton>
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
            <Box ml={4} display="inline-flex" alignItems="center" verticalAlign="middle">
              <img
                src={navbarLogo}
                alt="HY logo"
                width="50"
                height="50"
                style={{ objectFit: "contain", display: "block" }}
              />
            </Box>
          </Box>
        </Container>
      </Box>
      <UserManualModal
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
        isFrontpage={isFrontpage}
        isHomepage={isHomepage}
        isPresentationPage={isPresentationPage}
      />
    </>
  )
}

export default NavBar
