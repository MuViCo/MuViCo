/** toastUtils.js
 * Utility functions for displaying toast notifications using Chakra UI's useToast hook.
 * Provides a custom hook, useCustomToast, that returns a showToast function for easy toast display.
 */

import { useToast } from "@chakra-ui/react"

export const useCustomToast = () => {
  const toast = useToast()

  const showToast = ({ title, description, status }) => {
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