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

const Toolbox = ({ addCue }) => {
  const [isOpen, setIsOpen] = useState(false)

  const onClose = () => setIsOpen(false)
  const onOpen = () => setIsOpen(true)

  return (
    <>
      <Button onClick={onOpen} zIndex={2}>Add Element</Button>
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton zIndex={1} aria-label="Close drawer"/>
          <DrawerBody>
            <CuesForm addCue={addCue} onClose={onClose} />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  )
}

export default Toolbox
