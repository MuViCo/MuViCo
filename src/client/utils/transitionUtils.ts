import { keyframes } from "@emotion/react"

export const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`

export const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`

export const slideInLeft = keyframes`
  from { transform: translateX(-100%); opacity: 0 }
  to { transform: translateX(0); opacity: 1 }
`

export const slideOutLeft = keyframes`
  from { transform: translateX(0); opacity: 1 }
  to { transform: translateX(-100%); opacity: 0 }
`

export const slideInRight = keyframes`
  from { transform: translateX(100%); opacity: 0 }
  to { transform: translateX(0); opacity: 1 }
`

export const slideOutRight = keyframes`
  from { transform: translateX(0); opacity: 1 }
  to { transform: translateX(100%); opacity: 0 }
`

export const zoomIn = keyframes`
  from { transform: scale(0.95); opacity: 0 }
  to { transform: scale(1); opacity: 1 }
`

export const zoomOut = keyframes`
  from { transform: scale(1); opacity: 1 }
  to { transform: scale(1.05); opacity: 0 }
`

export const getAnims = (type) => {
  if (type === "fade") return { enter: fadeIn, exit: fadeOut }
  if (type === "zoom") return { enter: zoomIn, exit: zoomOut }
  if (type === "slide-left") return { enter: slideInLeft, exit: slideOutRight }
  if (type === "slide-right") return { enter: slideInRight, exit: slideOutLeft }
  if (type === "none") return { enter: null, exit: null }
  // default = fade
  return { enter: fadeIn, exit: fadeOut }
}

export default {
  getAnims,
}
