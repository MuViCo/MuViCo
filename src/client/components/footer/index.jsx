import { Box } from "@chakra-ui/react"
import { Link } from "react-router-dom"
import { useState, useEffect } from "react"

const Footer = () => {
  const [version, setVersion] = useState("unknown")

  useEffect(() => {
    fetch("https://api.github.com/repos/MuViCo/MuViCo/releases/latest")
      .then((res) => res.json())
      .then((data) => {
        // Extract version from tag (e.g., "v1.0.0" -> "1.0.0")
        const versionTag = data.tag_name.replace(/^v/, "")
        setVersion(versionTag)
      })
      .catch((error) => {
        console.error("Failed to fetch version:", error)
        // Falls back to "unknown" if fetch fails
      })
  }, [])

  return (
    <Box p="4" align="center" opacity={0.4} fontSize="sm">
      &copy; {new Date().getFullYear()} MuViCo v{version}. All Rights Reserved.
      <Link to="https://github.com/MuViCo/MuViCo">https://github.com/MuViCo/MuViCo</Link>
    </Box>
  )
}

export default Footer
