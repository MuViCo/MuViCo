import { Box, Text } from "@chakra-ui/react"
import { useLayoutEffect, useRef } from "react"

const MaintenanceNotice = ({ isVisible = true, onHeightChange = () => {} }) => {
  const noticeRef = useRef(null)

  useLayoutEffect(() => {
    if (!isVisible) {
      onHeightChange(0)
      return undefined
    }

    const element = noticeRef.current
    if (!element) {
      return undefined
    }

    const updateHeight = () => {
      onHeightChange(element.getBoundingClientRect().height)
    }

    updateHeight()

    const observer = new ResizeObserver(() => {
      updateHeight()
    })
    observer.observe(element)

    return () => observer.disconnect()
  }, [isVisible, onHeightChange])

  if (!isVisible) {
    return null
  }

  return (
    <Box
      ref={noticeRef}
      as="section"
      position="fixed"
      top={0}
      left={0}
      right={0}
      width="100%"
      zIndex={1200}
      bg="orange.400"
      color="black"
      px={4}
      py={2}
      textAlign="center"
      boxShadow="sm"
    >
      <Text fontWeight="semibold" fontSize={{ base: "sm", md: "md" }}>
        MuViCo is moving to a new platform. All old presentations are
        temporarily disabled.
      </Text>
    </Box>
  )
}

export default MaintenanceNotice