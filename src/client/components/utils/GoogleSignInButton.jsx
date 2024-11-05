import React from "react"
import { auth, googleProvider } from "./firebase"
import { signInWithPopup } from "firebase/auth"
import { Button, Box, Image, Text } from "@chakra-ui/react"
import axios from "axios"

const GoogleSignInButton = ({ onLogin }) => {
  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const idToken = await result.user.getIdToken(true)
      const response = await axios.post(
        "/api/login/firebase",
        {},
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      )
      
      const user = response.data
      window.localStorage.setItem("user", JSON.stringify(user) ?? "No user")
      onLogin(user) 
    } catch (error) {
      console.error("Error signing in with Google:", error)
    }
  }

  return (
    <Button
      onClick={handleGoogleSignIn}
      colorScheme="gray"
      variant="outline"
      size="lg"
      mt={4}
      mb={4}
      fontWeight="medium"
      _hover={{ bg: "gray.100" }}
      display="flex"
      alignItems="center"
      justifyContent="center"
      gap={2}
    >
      <Image
        src="/google-logo.jpeg"  
        alt="google"
        boxSize="20px"
        mr={2}
      />
    </Button>
  )
}


export default GoogleSignInButton

