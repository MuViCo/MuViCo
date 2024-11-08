import { ChakraProvider, Box, Container } from "@chakra-ui/react"
import { Route, Routes, Navigate } from "react-router-dom"

import { useState, useEffect } from "react"

import theme from "./lib/theme"
import Fonts from "./lib/fonts"

import NavBar from "./components/navbar"
import FrontPage from "./components/frontpage"
import HomePage from "./components/homepage"
import PresentationPage from "./components/presentation"
import TermsPage from "./components/termspage"
import UserMedia from "./components/admin/UserMedia"
import UsersList from "./components/admin/UsersList"
import UserPresentations from "./components/admin/UserPresentations"
import Footer from "./components/footer"

const App = () => {
  const [user, setUser] = useState(null)

  const [isInitialized, setIsInitialized] = useState(false)

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
      <Box>
        <NavBar user={user} setUser={setUser} />
        <Container pt={20} maxW="container.xl">
          <Routes>
            <Route path="/" element={<FrontPage />} />
            <Route
              path="/home"
              element={user ? <HomePage user={user} setUser={setUser} /> : <Navigate to="/" />}
            />
            <Route
              path="/presentation/:id"
              element={
                user ? (
                  <PresentationPage userId={user.id} setUser={setUser} />
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
              path="/userspresentations/:id"
              element={<UserPresentations />}
            />
          </Routes>
        </Container>
        <Footer />
      </Box>
    </ChakraProvider>
  )
}

export default App
