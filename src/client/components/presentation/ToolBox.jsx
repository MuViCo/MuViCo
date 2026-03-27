import {
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerBody,
  Drawer,
  Text,
} from "@chakra-ui/react"

const Toolbox = ({
  isOpen,
  onClose,
}) => {
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
            <Text>Toolbox features coming soon</Text>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  )
}

export default Toolbox
