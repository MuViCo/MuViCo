import { useState, useImperativeHandle, forwardRef } from "react"
import { Button, Box } from "@chakra-ui/react"

const Togglable = forwardRef(({ buttonLabel, exitLabel, children }, ref) => {
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
          onClick={toggleVisibility}
          mb={2}
          width="200px"
          height="60px"
          fontWeight="bold"
        >
          {buttonLabel}
        </Button>
      )}
      {visible && <Box>{children}</Box>}
    </Box>
  )
})

export default Togglable
