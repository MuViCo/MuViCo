/** toastUtils.js
 * Utility functions for displaying toast notifications using Chakra UI's useToast hook.
 * Provides a custom hook, useCustomToast, that returns a showToast function for easy toast display.
 */

import { useEffect, useRef } from "react"
import { useToast } from "@chakra-ui/react"
import { SESSION_EXPIRED_EVENT } from "../../utils/axiosAuthInterceptor"

// How long to hold off on "error" toasts after a session-expiry is detected.
// NavBar already shows a clear message and redirects when this fires, so the
// many call sites across the app that independently toast on a failed API
// call would otherwise show a second, confusing message for the same event.
const SESSION_EXPIRED_SUPPRESSION_WINDOW_MS = 5000

export const useCustomToast = () => {
  const toast = useToast()
  const sessionExpiredRef = useRef(false)

  useEffect(() => {
    let resetTimer
    const markSessionExpired = () => {
      sessionExpiredRef.current = true
      clearTimeout(resetTimer)
      resetTimer = setTimeout(() => {
        sessionExpiredRef.current = false
      }, SESSION_EXPIRED_SUPPRESSION_WINDOW_MS)
    }

    window.addEventListener(SESSION_EXPIRED_EVENT, markSessionExpired)
    return () => {
      // Cleanup the event listener when components using this hook unmount
      window.removeEventListener(SESSION_EXPIRED_EVENT, markSessionExpired)
      clearTimeout(resetTimer)
    }
  }, [])

  const showToast = ({ title, description, status }) => {
    if (status === "error" && sessionExpiredRef.current) {
      return
    }

    toast({
      title,
      description,
      status,
      position: "top",
      duration: 3000,
      isClosable: true,
    })
  }

  return showToast
}
