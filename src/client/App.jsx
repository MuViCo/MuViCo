import { ChakraProvider, Box, Container } from "@chakra-ui/react"
import { Routes, Route, Navigate } from "react-router-dom"
import { useState, useEffect } from "react"

import NavBar from "./components/navbar/"
import FrontPage from "./components/frontpage"
import HomePage from "./components/homepage"
import theme from "./lib/theme"
import PresentationPage from "./components/presentation/"

const App = () => {
  const [user, setUser] = useState(null)

  console.log(user)

  useEffect(() => {
    const loggedUserJSON = window.localStorage.getItem("user")
    if (loggedUserJSON) {
      const user = JSON.parse(loggedUserJSON)
      setUser(user)
    }
  }, [])

  return (
    <ChakraProvider theme={theme}>
      <Box>
        <NavBar user={user} setUser={setUser} />
        <Container pt={20}>
          <Routes>
            <Route path="/" element={<FrontPage />} />
            <Route
              path="/home"
              element={user ? <HomePage /> : <Navigate to="/" />}
            />
            <Route
              path="/presentation"
              element={user ? <PresentationPage /> : <Navigate to="/" />}
            />
          </Routes>
        </Container>
      </Box>
    </ChakraProvider>
  )
}

export default App
