import { Box } from "@chakra-ui/react"
import { Link } from "react-router-dom"

const Footer = () => (
  <Box p="4" textAlign="center" opacity={0.4} fontSize="sm" marginTop="auto" className="footer">
    &copy; {new Date().getFullYear()} MuViCo v{__APP_VERSION__}. All rights reserved. {" "}
    <Link to="/terms">Terms</Link> | <Link to="/privacy">Privacy & Cookies</Link> | {" "}
    <a href="https://github.com/MuViCo/MuViCo">GitHub</a>
  </Box>
)

export default Footer
 