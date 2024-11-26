import React from "react"
import { Box, Tooltip, Spinner } from "@chakra-ui/react"
import { CheckIcon } from "@chakra-ui/icons"

const StatusTooltip = ({ status }) => (
  <Tooltip
    label={status === "loading" ? "Saving in progress..." : "Your changes are saved!"}
    aria-label="Status Tooltip"
    placement="right"
    zIndex="tooltip"
  >
    <Box>
      {status === "loading" ? (
        <Spinner size="md" color="purple.200" />
      ) : (
        <CheckIcon w={6} h={6} color="purple.200" />
      )}
    </Box>
  </Tooltip>
)

export default StatusTooltip