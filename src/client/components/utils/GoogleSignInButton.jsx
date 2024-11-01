import React from "react"
import { auth, googleProvider } from "./firebase"
import { signInWithPopup } from "firebase/auth"
import axios from "axios"

const GoogleSignInButton = ({ onLogin }) => {
  const handleGoogleSignIn = async () => {
    try {
      //console.log("Signing in with Google", auth, googleProvider)
      const result = await signInWithPopup(auth, googleProvider)
      const idToken = await result.user.getIdToken()

      const response = await axios.post(
        "/api/login/firebase",
        {},
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      )

      onLogin(response.data.user)
      window.localStorage.setItem("user", JSON.stringify(response.data.user))
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

