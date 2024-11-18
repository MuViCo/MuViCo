import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"

import firebaseConfig from "./config"

console.log('firebaseConfig:', firebaseConfig)

const app = initializeApp(firebaseConfig)

const auth = getAuth(app)
const googleProvider = new GoogleAuthProvider()


export {
  auth,
  googleProvider,
}
