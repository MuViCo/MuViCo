import { useEffect } from "react"
import { Navigate, useLocation } from "react-router-dom"

import { rememberLoginRedirect } from "../../utils/loginRedirect"
import { useCustomToast } from "./toastUtils"

const LoginRedirect = () => {
  const { pathname } = useLocation()
  const showToast = useCustomToast()

  useEffect(() => {
    rememberLoginRedirect(pathname)
    showToast({
      title: "Log in to continue",
      description: "You need to be logged in to MuViCo to view this.",
      status: "info",
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <Navigate to="/" replace />
}

export default LoginRedirect
