import { ChakraProvider, Box, Container } from "@chakra-ui/react"
import { Route, Routes, Navigate, useLocation } from "react-router-dom"

import { useState, useEffect } from "react"

import theme from "./lib/theme"
import Fonts from "./lib/fonts"

import NavBar from "./components/navbar"
import FrontPage from "./components/frontpage"
import HomePage from "./components/homepage"
import PresentationPage from "./components/presentation"
import TermsPage from "./components/termspage"
import PrivacyPage from "./components/privacypage"
import UserMedia from "./components/admin/UserMedia"
import UsersList from "./components/admin/UsersList"
import UserPresentations from "./components/admin/UserPresentations"
import Footer from "./components/footer"
import Profile from "./components/profilepage/profile"
import MaintenanceNotice from "./components/maintenancenotice"
import authService from "./services/auth"

const App = () => {
  const [user, setUser] = useState(null)
  const [bannerHeight, setBannerHeight] = useState(40)

  const [isInitialized, setIsInitialized] = useState(false)

  const location = useLocation()
  const isPresentation = location.pathname.startsWith("/presentation")
  const isHome = location.pathname.startsWith("/home")
  const isProfile = location.pathname.startsWith("/profile")


  useEffect(() => {
    const loggedUserJSON = window.localStorage.getItem("user")
    if (loggedUserJSON) {
      const parsedUser = JSON.parse(loggedUserJSON)
      setUser(parsedUser)
    }
    setIsInitialized(true)
  }, [])

  if (!isInitialized) {
    return <div>Loading...</div>
  }



  return (
    <ChakraProvider theme={theme}>
      <Fonts />
      <Box minH="100vh" display="flex" flexDirection="column">
        <MaintenanceNotice onHeightChange={setBannerHeight} />
        <NavBar user={user} setUser={setUser} topOffset={bannerHeight} />
        <Container
          flex="1"
          pt={isPresentation || isHome || isProfile ? 36 : 30}
          maxW={isPresentation ? "none" : "container.xl"}
          pl={isPresentation ? 0 : 4}
          pr={isPresentation ? 0 : 4}
        >
          <Routes >
            <Route path="/" element={<FrontPage />} />
            <Route
              path="/home"
              element={
                user ? (
                  <HomePage user={user} setUser={setUser} />
                ) : (
                  <Navigate to="/" />
                )
              }
            />
            <Route
              path="/presentation/:id"
              element={
                user ? (
                  <PresentationPage
                    user={user}
                    userId={user.id}
                    setUser={setUser}
                  />
                ) : (
                  <Navigate to="/" />
                )
              }
            />
            <Route
              path="/users"
              element={
                user && user.isAdmin ? <UsersList /> : <Navigate to="/" />
              }
            />
            <Route
              path="/media"
              element={
                user && user.isAdmin ? <UserMedia /> : <Navigate to="/" />
              }
            />
            <Route path="/terms" element={<TermsPage />} />
            <Route
              path="/profile"
              element={user ? <Profile user={user} /> : <Navigate to="/" />}
            />
            <Route
              path="/userspresentations/:id"
              element={<UserPresentations />}
            />
            <Route path="/privacy" element={<PrivacyPage />} />
          </Routes>
        </Container>
        <Footer />
      </Box>
    </ChakraProvider>
  )
}

export default App
