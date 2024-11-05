import React from "react"
import { auth, googleProvider } from "./firebase"
import { signInWithPopup } from "firebase/auth"
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
    <button onClick={handleGoogleSignIn}>
      Sign in with Google
    </button>
  )
}

export default GoogleSignInButton

