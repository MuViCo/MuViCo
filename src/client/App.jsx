import { ChakraProvider, Box, Container } from "@chakra-ui/react"
import { Routes, Route } from "react-router-dom"
import NavBar from "./components/navbar/"
import FrontPage from "./components/frontpage"
import HomePage from "./components/homepage"
import theme from "./lib/theme"
import PresentationPage from './components/presentation/'

const App = () => {
  return (
    <ChakraProvider theme={theme}>
      <Box>
        <NavBar />
        <Container pt={20}>
          <Routes>
            <Route path="/" element={<FrontPage />} />
            <Route path="/presentation" element={<PresentationPage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/presentation" element={<PresentationPage />} />
          </Routes>
        </Container>
      </Box>
    </ChakraProvider>
  )
}

export default App
