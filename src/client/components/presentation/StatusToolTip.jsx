import React, { useEffect, useRef, useState } from "react"
import { useSelector } from "react-redux"
import { Box, Tooltip, Spinner } from "@chakra-ui/react"
import { CheckIcon } from "@chakra-ui/icons"

// How long the "saved" checkmark stays visible before fading out, so it
// doesn't linger as noise once nothing is happening.
const SAVED_FADE_DELAY_MS = 2000

const StatusTooltip = () => {
  const pendingSaves = useSelector((state) => state.presentation.pendingSaves)
  const status = pendingSaves > 0 ? "loading" : "saved"
  // Starts hidden, not visible: on mount there's no save to report yet, so
  // there's nothing to show until the first "loading" transition reveals it.
  const [visible, setVisible] = useState(false)
  const fadeTimerRef = useRef(null)

  useEffect(() => {
    clearTimeout(fadeTimerRef.current)

    if (status === "loading") {
      setVisible(true)
      return
    }

    fadeTimerRef.current = setTimeout(() => {
      setVisible(false)
    }, SAVED_FADE_DELAY_MS)

    return () => clearTimeout(fadeTimerRef.current)
  }, [status])

  return (
    <Tooltip
      label={
        status === "loading"
          ? "Saving in progress..."
          : "Your changes are saved!"
      }
      aria-label="Status Tooltip"
      placement="left"
      zIndex="tooltip"
    >
      <Box
        data-testid="status-tooltip-badge"
        opacity={visible ? 1 : 0}
        transition="opacity 400ms ease"
        pointerEvents={visible ? "auto" : "none"}
      >
        {status === "loading" ? (
          <Spinner size="md" color="purple.200" />
        ) : (
          <CheckIcon w={6} h={6} color="purple.200" />
        )}
      </Box>
    </Tooltip>
  )
}

export default StatusTooltip
