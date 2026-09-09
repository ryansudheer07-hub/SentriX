"use client"

import { useEffect, type ReactNode } from "react"

import { Portal } from "./Portal"

/**
 * A sliding intelligence surface (brief §16). Desktop: glides in from the right
 * (~460px). Mobile: a bottom sheet. Glass-3, own scroll container, Escape to
 * close, backdrop scrim. Reused by graph-node inspection now; alert / evidence
 * detail later.
 */
type IntelligenceDrawerProps = {
  open: boolean
  onClose: () => void
  title?: string
  /** Extra class on the drawer surface. */
  className?: string
  children: ReactNode
}

export function IntelligenceDrawer({
  open,
  onClose,
  title,
  className,
  children,
}: IntelligenceDrawerProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  return (
    <Portal>
      <div
        className={"intel-drawer-root" + (open ? " intel-drawer-root--on" : "")}
        aria-hidden={!open}
      >
        <div className="intel-drawer__scrim" onClick={onClose} />
        <aside
          className={"intel-drawer" + (className ? ` ${className}` : "")}
          role="dialog"
          aria-label={title ?? "Details"}
          aria-modal="true"
          inert={!open}
        >
          <div className="intel-drawer__grip" aria-hidden="true" />
          <div className="intel-drawer__head">
            <span className="eyebrow eyebrow--gold">{title ?? "Details"}</span>
            <button
              type="button"
              className="intel-drawer__close"
              aria-label="Close"
              onClick={onClose}
            >
              ✕
            </button>
          </div>
          <div className="intel-drawer__body">{children}</div>
        </aside>
      </div>
    </Portal>
  )
}
