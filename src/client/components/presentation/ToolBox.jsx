import {
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerBody,
  Drawer,
} from "@chakra-ui/react"

import CuesForm from "./Cues"

const Toolbox = ({ addCue, isOpen, onClose, position }) => {

  return (
    <>
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton zIndex={1} aria-label="Close drawer"data-testid="close-drawer-button" />
          <DrawerBody>
            <CuesForm addCue={addCue} onClose={onClose} position={position} />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  )
}

export default Toolbox
