import { ChakraProvider, Box, Container } from "@chakra-ui/react"
import { Routes, Route, Navigate } from "react-router-dom"
import { useState, useEffect } from "react"

import NavBar from "./components/navbar/"
import FrontPage from "./components/frontpage"
import HomePage from "./components/homepage"
import theme from "./lib/theme"
import PresentationPage from "./components/presentation/"
import presentationService from "./services/presentations"
import Fonts from "./lib/fonts"
import PhotoPage from "./components/photopage"


const App = () => {
  const [user, setUser] = useState(null)

  console.log("user", user)

  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const loggedUserJSON = window.localStorage.getItem("user")
    if (loggedUserJSON) {
      const user = JSON.parse(loggedUserJSON)
      setUser(user)
      presentationService.setToken(user.token)
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
        <Container pt={20} maxW="container.md">
          <Routes>
            <Route path="/" element={<FrontPage />} />
            <Route
              path="/home"
              element={user ? <HomePage /> : <Navigate to="/" />}
            />
            <Route
              path="/presentation/:id"
              element={user ? <PresentationPage /> : <Navigate to="/" />}
            />
             <Route path="/photos" element={<PhotoPage />} />
          </Routes>
          
        </Container>
      </Box>
    </ChakraProvider>
  )
}

export default App
