import React, { useEffect, useState, useRef } from "react"
import { createPortal } from "react-dom"
import { Box, Button, Text, VStack, HStack } from "@chakra-ui/react"
import { keyframes } from "@emotion/react"

const TutorialGuide = ({ steps = [], isOpen = false, onClose = () => {}, storageKey }) => {
  const [open, setOpen] = useState(isOpen)
  const [index, setIndex] = useState(0)
  const [pos, setPos] = useState(null)
  const containerRef = useRef(null)

  const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  `
  const fadeOpacity = keyframes`
    from { opacity: 0; }
    to { opacity: 1; }
  `

  const isTyping = () => {
    const ae = document.activeElement
    if (!ae) return false
    const tag = ae.tagName
    if (tag === "INPUT" || tag === "TEXTAREA" || ae.isContentEditable) return true
    return false
  }

  useEffect(() => {
    setOpen(isOpen)
    if (isOpen) setIndex(0)
  }, [isOpen])

  useEffect(() => {
    if (!open) return
    const handle = () => updatePosition()
    window.addEventListener("resize", handle)
    window.addEventListener("scroll", handle, true)
    updatePosition()
    return () => {
      window.removeEventListener("resize", handle)
      window.removeEventListener("scroll", handle, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, index])

  // Prevent background scrolling while the tutorial is open.
  useEffect(() => {
    if (!open) return

    const prevOverflow = document.body.style.overflow
    const prevTouch = document.body.style.touchAction

    document.body.style.overflow = "hidden"
    document.body.style.touchAction = "none"

    const prevent = (e) => {
      if (e && e.preventDefault) e.preventDefault()
      return false
    }
    window.addEventListener("wheel", prevent, { passive: false })
    window.addEventListener("touchmove", prevent, { passive: false })

    return () => {
      // When done, restore previous styles
      document.body.style.overflow = prevOverflow
      document.body.style.touchAction = prevTouch
      window.removeEventListener("wheel", prevent)
      window.removeEventListener("touchmove", prevent)
    }
  }, [open])

  // keyboard shortcuts: Enter/ArrowRight -> next, ArrowLeft -> prev, Escape -> finish
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (isTyping()) return
      if (e.key === "Escape") {
        finish()
      } else if (e.key === "Enter" || e.key === "ArrowRight") {
        e.preventDefault()
        next()
      } else if (e.key === "ArrowLeft") {
        e.preventDefault()
        prev()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, index])

  useEffect(() => {
    if (open && (!steps || steps.length === 0)) {
      finish()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps, open])

  const updatePosition = () => {
    const step = steps[index]
    if (!step || !step.selector) {
      if (step && step.center) {
        setPos({ centered: true })
        return
      }
      setPos(null)
      return
    }
    const el = document.querySelector(step.selector)
    if (!el) {
      setPos(null)
      return
    }
    const r = el.getBoundingClientRect()
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth
    const mobileOffset = (viewportWidth  < 1400 && steps[index].posLeftNeeded) ? -280 : 0
    const manualLeftPos = steps[index].manualLeftPos
    // position tooltip near bottom-right of target by default (left adjusted for mobile if needed)
    const tooltip = {
      top: window.scrollY + r.top - 10,
      left: manualLeftPos != null ? manualLeftPos : window.scrollX + r.left + r.width + 12 + mobileOffset,
      targetRect: r,
    }
    setPos(tooltip)
  }

  const next = () => {
    if (index + 1 < steps.length) {
      setIndex(index + 1)
    } else {
      finish()
    }
  }

  const prev = () => {
    if (index - 1 >= 0) setIndex(index - 1)
  }

  const finish = () => {
    if (storageKey) localStorage.setItem(storageKey, "true")
    setOpen(false)
    onClose()
  }

  if (!open) return null

  // render overlay in document.body
  return createPortal(
    <Box
      ref={containerRef}
      pos="fixed"
      top={0}
      left={0}
      width="100%"
      height="100%"
      zIndex={1500}
      pointerEvents="none"
    >
      <Box position="absolute" inset={0} bg="blackAlpha.600" pointerEvents="auto" />

      {/* Centered box, not related to a specific selector */}
      {pos && pos.centered && (
        <Box key={`tutorial-centered-${index}`}
          position="fixed"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          maxW="320px"
          bg="white"
          color="black"
          p={6}
          borderRadius="md"
          boxShadow="lg"
          animation={`${fadeOpacity} 1000ms ease`}
          pointerEvents="auto"
          textAlign="center"
          zIndex={1600}
          data-testid={`tutorial-centered-${index}`}
        >
          <VStack alignItems="stretch" spacing={4}>
            <Box>
              <Text fontWeight={700} fontSize="lg">{steps[index].title}</Text>
              <Text whiteSpace="pre-wrap" fontSize="sm" mt={2}>{steps[index].description}</Text>
            </Box>
            <HStack justifyContent="space-between">
              <Button size="sm" colorScheme="purple" onClick={next}>
                {index + 1 < steps.length ? "Next" : "Done"}
              </Button>
              <Button size="sm" colorScheme="red" onClick={finish}>
                Quit Tutorial
              </Button>
            </HStack>
          </VStack>
        </Box>
      )}

      {/* Specific selector box, aligns with the item */}
      {pos && !pos.centered && (
        <Box key={`tutorial-step-${index}`}
          position="absolute"
          top={`${pos.top}px`}
          left={`${pos.left}px`}
          maxW="200px"
          bg="white"
          color="black"
          p={4}
          borderRadius="md"
          boxShadow="lg"
          animation={`${fadeIn} 240ms ease`}
          pointerEvents="auto"
          zIndex={1600}
          data-testid={`tutorial-step-${index}`}
        >
          <VStack alignItems="stretch" spacing={3}>
            <Box>
              <Text fontWeight={600}>{steps[index].title}</Text>
              <Text whiteSpace="pre-wrap" fontSize="sm">{steps[index].description}</Text>
            </Box>
            <HStack justifyContent="space-between">
              <Button size="sm" colorScheme="purple" onClick={next}>
                {index + 1 < steps.length ? "Next" : "Done"}
              </Button>
              <Button size="sm" colorScheme="purple" onClick={prev}>
                Prev
              </Button>
              <Button size="sm" colorScheme="red" onClick={finish}>
                Quit
              </Button>
            </HStack>
          </VStack>
        </Box>
      )}

      {/* Box highlight around target */}
      {pos && !pos.centered && (
        <Box
          position="absolute"
          top={`${window.scrollY + pos.targetRect.top - 6}px`}
          left={`${window.scrollX + pos.targetRect.left - 6}px`}
          width={`${pos.targetRect.width + 12}px`}
          height={`${pos.targetRect.height + 12}px`}
          borderRadius="6px"
          border="2px solid"
          borderColor="purple.300"
          boxShadow="0 0 0 6px rgba(128, 90, 213, 0.12)"
          transition="box-shadow 220ms ease, transform 220ms ease"
          pointerEvents="none"
          data-testid="tutorial-highlight"
        />
      )}
    </Box>,
    document.body
  )
}

export default TutorialGuide
