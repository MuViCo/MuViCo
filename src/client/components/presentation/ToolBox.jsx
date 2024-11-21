import {
  Button,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerBody,
  Drawer,
} from "@chakra-ui/react"
import { useState } from "react"

import CuesForm from "./Cues"

const Toolbox = ({ addCue, isOpen, onClose, position }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const handleOpen = () => {
    setIsDrawerOpen(true)
  }

  const handleClose = () => {
    setIsDrawerOpen(false)
    if (onClose) {
      onClose()
    }
  }

  return (
    <>
      <Button onClick={handleOpen} zIndex={2}>Add Element</Button>
      <Drawer isOpen={isDrawerOpen || isOpen} placement="left" onClose={handleClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton zIndex={1} aria-label="Close drawer"/>
          <DrawerBody>
            <CuesForm addCue={addCue} onClose={handleClose} position={position} />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  )
}

export default Toolbox
