import createCache from "@emotion/cache"
import { CacheProvider } from "@emotion/react"
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

  useEffect(() => {
    const popup = window.open("", "MuViCo Monitor", "width=1280,height=800")
    if (!popup) {
      onClose()
      return
    }
    windowRef.current = popup
    popup.document.title = title
    popup.document.documentElement.style.background = "#08060a"
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

  if (!host || !cache) return null
  return createPortal(
    <CacheProvider value={cache}>{children}</CacheProvider>,
    host
  )
}

export default ShowMonitorWindow
