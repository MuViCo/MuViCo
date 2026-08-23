/** ClickablePopover.tsx
 * A reusable popover component that can be triggered by a click.
 */

import React from "react"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  useDisclosure,
} from "@chakra-ui/react"

import type { PopoverProps } from "@chakra-ui/react"
import type { MouseEventHandler, ReactElement, ReactNode } from "react"

interface ClickablePopoverProps extends Omit<PopoverProps, "children"> {
  /**
   * A single element, cloned to attach the click handler -- so it has to be
   * something that accepts onClick.
   */
  children: ReactElement<{ onClick?: MouseEventHandler }>
  label: ReactNode
}

const ClickablePopover = ({
  children,
  label,
  ...popoverProps
}: ClickablePopoverProps) => {
  const { isOpen, onToggle, onClose } = useDisclosure()

  return (
    <Popover isOpen={isOpen} onClose={onClose} {...popoverProps}>
      <PopoverTrigger>
        {React.cloneElement(children, {
          onClick: onToggle,
        })}
      </PopoverTrigger>
      <PopoverContent>
        <PopoverBody>{label}</PopoverBody>
      </PopoverContent>
    </Popover>
  )
}

export default ClickablePopover
