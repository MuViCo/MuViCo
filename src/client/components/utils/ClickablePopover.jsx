/** ClickablePopover.jsx
 * A reusable popover component that can be triggered by a click.
 */

import React from "react"
import { Popover, PopoverTrigger, PopoverContent, PopoverBody, useDisclosure } from "@chakra-ui/react"

const ClickablePopover = ({ children, label, ...popoverProps }) => {
  const { isOpen, onToggle, onClose } = useDisclosure()

  return (
    <Popover isOpen={isOpen} onClose={onClose} {...popoverProps}>
      <PopoverTrigger>
        {React.cloneElement(children, {
          onClick: onToggle
        })}
      </PopoverTrigger>
      <PopoverContent>
        <PopoverBody>{label}</PopoverBody>
      </PopoverContent>
    </Popover>
  )
}

export default ClickablePopover