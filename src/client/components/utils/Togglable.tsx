/** Togglable.tsx
 * A reusable component for creating toggleable content sections.
 */

import { useState, useImperativeHandle, forwardRef } from "react"
import { Button, Box } from "@chakra-ui/react"

import type { ButtonProps } from "@chakra-ui/react"
import type { ReactNode } from "react"

/** The imperative handle callers reach through the ref. */
export interface TogglableHandle {
  toggleVisibility: () => void
}

interface TogglableProps {
  buttonLabel: ReactNode
  children?: ReactNode
  buttonId?: string
  buttonProps?: ButtonProps
}

// forwardRef is deprecated in React 19 but still exported and typed. Moving to
// the ref-as-prop form would be a refactor, so the existing shape is kept.
const Togglable = forwardRef<TogglableHandle, TogglableProps>(
  ({ buttonLabel, children, buttonId, buttonProps = {} }, ref) => {
    const [visible, setVisible] = useState(false)

    const toggleVisibility = () => {
      setVisible(!visible)
    }

    useImperativeHandle(ref, () => ({
      toggleVisibility,
    }))

    return (
      <Box>
        {!visible && (
          <Button
            id={buttonId}
            onClick={toggleVisibility}
            mb={2}
            width="200px"
            height="40px"
            {...buttonProps}
          >
            {buttonLabel}
          </Button>
        )}
        {visible && <Box>{children}</Box>}
      </Box>
    )
  }
)

export default Togglable
