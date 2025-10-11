import React from "react"
import { Slide, Alert, AlertIcon, AlertTitle, AlertDescription, Box } from "@chakra-ui/react"

const CustomAlert = ({ showAlert = false, alertData = {} }) => {
  const { title = "", description = "", status = "info" } = alertData

  if (!showAlert || !title) return null

  return (
    <Box position="fixed" bottom="80px" right="20px" zIndex={2000}>
      <Slide direction="bottom" in={showAlert} style={{ position: "relative" }}>
        <Alert
          status={status}
          borderRadius="md"
          boxShadow="lg"
          role="status"
        >
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>{title}</AlertTitle>
            <AlertDescription display="block">{description}</AlertDescription>
          </Box>
        </Alert>
      </Slide>
    </Box>
  )
}

export default CustomAlert