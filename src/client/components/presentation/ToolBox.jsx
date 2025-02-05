import {
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerBody,
  Drawer,
} from "@chakra-ui/react"

import CuesForm from "./CuesForm"

const Toolbox = ({
  addCue,
  isOpen,
  onClose,
  position,
  cues,
  cueData,
  updateCue,
}) => {
  //console.log(`This is cueData in ToolBox:`, cueData)
  return (
    <>
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton
            zIndex={1}
            aria-label="Close drawer"
            data-testid="close-drawer-button"
          />
          <DrawerBody>
            <CuesForm
              addCue={addCue}
              onClose={onClose}
              position={position}
              cues={cues}
              cueData={cueData || null}
              updateCue={updateCue}
            />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  )
}

export default Toolbox
