/** AlertDialog.tsx
 * A reusable confirmation dialog component using Chakra UI's AlertDialog.
 */

import React, { useRef } from "react"
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogContent,
  AlertDialogOverlay,
  Button,
} from "@chakra-ui/react"

import type { ReactNode } from "react"

interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  message: ReactNode
  isCentered?: boolean
}

const ConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  message,
  isCentered = false,
}: ConfirmationDialogProps) => {
  // Typed to the element it is attached to: Chakra's leastDestructiveRef
  // requires a ref to something focusable.
  const cancelRef = useRef<HTMLButtonElement>(null)

  return (
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={cancelRef}
      onClose={onClose}
      isCentered={isCentered}
    >
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogBody>{message}</AlertDialogBody>

          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={onConfirm} ml={3}>
              Yes
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  )
}

export default ConfirmationDialog
