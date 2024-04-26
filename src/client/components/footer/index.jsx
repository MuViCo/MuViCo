import { Box } from "@chakra-ui/react"
import { Link } from "react-router-dom"

const Footer = () => (
  <Box p="4" align="center" opacity={0.4} fontSize="sm">
    &copy; {new Date().getFullYear()} MuViCo. All Rights Reserved.
    <Link to="https://github.com/MuViCo/MuViCo">https://github.com/MuViCo/MuViCo</Link>
  </Box>
)

export default Footer
