import { forwardRef, useImperativeHandle, useState } from "react"
import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/react"
import { AddIcon } from "@chakra-ui/icons"
import PresentationForm from "./PresentationForm"

import type { RefObject } from "react"
import type { TogglableHandle } from "../utils/Togglable"
import type { CreatePresentationInput } from "../../types"

interface PresentationFormWrapperProps {
  createPresentation: (input: CreatePresentationInput) => void
  togglableRef?: RefObject<TogglableHandle | null>
  handleCancel: () => void
}

const PresentationFormWrapperContent = forwardRef<
  TogglableHandle,
  Omit<PresentationFormWrapperProps, "togglableRef">
>(({ createPresentation, handleCancel }, ref) => {
  const [isOpen, setIsOpen] = useState(false)

  const toggleVisibility = () => setIsOpen((current) => !current)

  useImperativeHandle(ref, () => ({ toggleVisibility }))

  return (
    <>
      <Button
        id="presentation-form-togglable"
        leftIcon={<AddIcon />}
        variant="muvico-primary"
        onClick={toggleVisibility}
      >
        New presentation
      </Button>
      <Modal isCentered isOpen={isOpen} onClose={handleCancel}>
        <ModalOverlay backdropFilter="blur(8px)" />
        <ModalContent className="presentation-create-modal">
          <ModalHeader>New presentation</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={5}>
            <PresentationForm
              createPresentation={createPresentation}
              onCancel={handleCancel}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
})

const PresentationFormWrapper = ({
  togglableRef,
  ...props
}: PresentationFormWrapperProps) => (
  <PresentationFormWrapperContent ref={togglableRef} {...props} />
)

export default PresentationFormWrapper
