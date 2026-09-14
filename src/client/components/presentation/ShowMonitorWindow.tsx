import createCache from "@emotion/cache"
import { CacheProvider } from "@emotion/react"
import { useColorMode } from "@chakra-ui/react"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import type { ReactNode } from "react"

interface ShowMonitorWindowProps {
  title: string
  children: ReactNode
  onClose: () => void
}

const ShowMonitorWindow = ({
  title,
  children,
  onClose,
}: ShowMonitorWindowProps) => {
  const windowRef = useRef<Window | null>(null)
  const [host, setHost] = useState<HTMLElement | null>(null)
  const [cache, setCache] = useState<ReturnType<typeof createCache> | null>(
    null
  )
  const { colorMode } = useColorMode()

  useEffect(() => {
    const popup = window.open("", "MuViCo Monitor", "width=1280,height=800")
    if (!popup) {
      onClose()
      return
    }
    windowRef.current = popup
    popup.document.title = title
    popup.document.documentElement.style.background =
      getComputedStyle(document.documentElement).getPropertyValue(
        "--show-canvas"
      ) || "#08060a"
    popup.document.documentElement.style.height = "100%"
    popup.document.body.style.margin = "0"
    popup.document.body.style.height = "100%"
    popup.document.body.style.overflow = "hidden"
    document
      .querySelectorAll("link[rel='stylesheet'], style")
      .forEach((node) => popup.document.head.appendChild(node.cloneNode(true)))
    setHost(popup.document.body)
    setCache(
      createCache({ key: "show-monitor", container: popup.document.head })
    )

    const handleClose = () => onClose()
    popup.addEventListener("beforeunload", handleClose)
    const poll = window.setInterval(() => {
      if (popup.closed) onClose()
    }, 750)

    return () => {
      window.clearInterval(poll)
      popup.removeEventListener("beforeunload", handleClose)
      if (!popup.closed) popup.close()
      windowRef.current = null
      setHost(null)
      setCache(null)
    }
  }, [onClose, title])

  useEffect(() => {
    const popup = windowRef.current
    if (!popup || popup.closed) return

    const source = getComputedStyle(document.documentElement)
    const root = popup.document.documentElement
    Array.from(source).forEach((name) => {
      if (name.startsWith("--show-") || name.startsWith("--muvico-")) {
        root.style.setProperty(name, source.getPropertyValue(name))
      }
    })
    root.style.background =
      source.getPropertyValue("--show-canvas") || "#08060a"
  }, [colorMode, host])

  if (!host || !cache) return null
  return createPortal(
    <CacheProvider value={cache}>{children}</CacheProvider>,
    host
  )
}

export default ShowMonitorWindow
