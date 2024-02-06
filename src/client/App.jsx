import { ChakraProvider, Box, Container } from "@chakra-ui/react"
import { Routes, Route } from "react-router-dom"
import NavBar from "./components/frontpage/NavBar"
import FrontPage from "./components/frontpage"
import HomePage from "./components/homepage"
import theme from "./lib/theme"

const App = () => {
  return (
    <ChakraProvider theme={theme}>
      <Box>
        <NavBar />
        <Container maxW="container.md" pt={20}>
          <Routes>
            <Route path="/" element={<FrontPage />} />
            <Route path="/home" element={<HomePage />} />
          </Routes>
        </Container>
      </Box>
    </ChakraProvider>
  )
}

export default App
