import { ChakraProvider, Box, Container } from '@chakra-ui/react'
import NavBar from './components/frontpage/NavBar'
import FrontPage from './components/frontpage'
import theme from './lib/theme'

const App = () => {
  return (
    <ChakraProvider theme={theme}>
      <Box>
      <NavBar />
        <Container maxW="container.md" pt={20}>
      <FrontPage />
      </Container>
      </Box>
    </ChakraProvider>
  )
}

export default App
