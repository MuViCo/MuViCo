import { Box } from "@chakra-ui/react"
import { Link } from "react-router-dom"
import { useState, useEffect } from "react"
import { version } from "../../../../package.json"

const Footer = () => (
  <Box p="4" textAlign="center" opacity={0.4} fontSize="sm">
    &copy; {new Date().getFullYear()} MuViCo v{version}. All rights reserved. 
    <Link to="https://github.com/MuViCo/MuViCo">https://github.com/MuViCo/MuViCo</Link>
  </Box>
)

export default Footer
