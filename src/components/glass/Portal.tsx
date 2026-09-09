"use client"

import { useEffect, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"

/**
 * Renders children into `document.body` so fixed overlays (drawers, sheets)
 * are never clipped by an ancestor that happens to establish a containing
 * block — e.g. the top nav's `backdrop-filter`, or a `.panel`'s. Mounts on the
 * client only.
 */
export function Portal({ children }: { children: ReactNode }) {
  const [host] = useState(() =>
    typeof document === "undefined" ? null : document.createElement("div")
  )

  useEffect(() => {
    if (!host) return
    host.setAttribute("data-sentrix-portal", "")
    document.body.appendChild(host)
    return () => {
      document.body.removeChild(host)
    }
  }, [host])

  if (!host) return null
  return createPortal(children, host)
}
