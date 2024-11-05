import React from "react"
import { auth, googleProvider } from "./firebase"
import { signInWithPopup } from "firebase/auth"
import axios from "axios"

const GoogleSignInButton = ({ onLogin }) => {
  const handleGoogleSignIn = async () => {
    try {
      //console.log("Signing in with Google", auth, googleProvider)
      const result = await signInWithPopup(auth, googleProvider)
      const idToken = await result.user.getIdToken(true)
      console.log("idToken", idToken)
      const response = await axios.post(
        "/api/login/firebase",
        {},
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      )
      
      // const user = response.data.user 
      // window.localStorage.setItem("user", JSON.stringify(user) ?? "No user")
      // console.log("User", user ?? "No user")
      // onLogin(user) 
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

