"use client"

import { useEffect, type ReactNode } from "react"

import { GlassSurface } from "./GlassSurface"

/**
 * A glass overlay that glides in from rest and traps nothing but its own
 * scroll. The shared shell for later phases — the graph-detail popup (§15),
 * alert expansion (§18) and the AI console modes (§20) all sit on this.
 *
 * Motion is CSS (`.floating-panel` in globals.css, `--ease-fluid` / `--dur-panel`);
 * this component only toggles the open class, `inert` and `Escape`.
 */
type FloatingPanelProps = {
  open: boolean
  onClose?: () => void
  /** 2 = raised card, 3 = intelligence overlay (default). */
  level?: 2 | 3
  className?: string
  role?: "dialog" | "menu" | "region"
  "aria-label"?: string
  "aria-labelledby"?: string
  "aria-modal"?: boolean
  children: ReactNode
}

export function FloatingPanel({
  open,
  onClose,
  level = 3,
  className,
  role = "dialog",
  children,
  ...aria
}: FloatingPanelProps) {
  useEffect(() => {
    if (!open || !onClose) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  return (
    <GlassSurface
      level={level}
      className={
        "floating-panel" +
        (open ? " floating-panel--open" : "") +
        (className ? ` ${className}` : "")
      }
      role={role}
      aria-hidden={!open}
      inert={!open}
      {...aria}
    >
      {children}
    </GlassSurface>
  )
}
