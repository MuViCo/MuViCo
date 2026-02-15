import { Box } from "@chakra-ui/react"
import { Link } from "react-router-dom"
import { useState, useEffect } from "react"

const Footer = () => (
  <Box p="4" textAlign="center" opacity={0.4} fontSize="sm">
    &copy; {new Date().getFullYear()} MuViCo v{__APP_VERSION__}. All rights reserved.
    <Link to="https://github.com/MuViCo/MuViCo">https://github.com/MuViCo/MuViCo</Link>
  </Box>
)

export default Footer
