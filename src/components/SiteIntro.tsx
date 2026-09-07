"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { BinaryField } from "./BinaryField"
import { BitcoinMedallion } from "./BitcoinMedallion"
import { SentrixWordmark } from "./SentrixWordmark"

const DROP_TO_LEAVE_MS = 650
const LEAVE_TO_DONE_MS = 650
const LEAVE_TO_DONE_MS_REDUCED = 340

type Phase = "idle" | "dropping" | "leaving" | "done"

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches

/**
 * The Sentrix landing gate: the wordmark on black with 0/1 streams down each
 * side. It stays until the visitor clicks the Bitcoin coin -- the coin drops
 * out of frame, then the whole overlay dissolves to reveal the dashboard.
 *
 * Rendered on the server too, so it's the first paint (no flash of the
 * dashboard). Scroll is locked until it's gone.
 */
export function SiteIntro() {
  const [phase, setPhase] = useState<Phase>("idle")
  const advancing = useRef(false)

  const enter = useCallback(() => {
    if (advancing.current) return
    advancing.current = true
    setPhase(prefersReducedMotion() ? "leaving" : "dropping")
  }, [])

  // dropping -> leaving -> done
  useEffect(() => {
    if (phase === "dropping") {
      const t = window.setTimeout(() => setPhase("leaving"), DROP_TO_LEAVE_MS)
      return () => window.clearTimeout(t)
    }
    if (phase === "leaving") {
      const t = window.setTimeout(
        () => setPhase("done"),
        prefersReducedMotion() ? LEAVE_TO_DONE_MS_REDUCED : LEAVE_TO_DONE_MS
      )
      return () => window.clearTimeout(t)
    }
  }, [phase])

  // Lock page scroll while the overlay is up.
  useEffect(() => {
    if (phase === "done") return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [phase])

  if (phase === "done") return null

  const busy = phase !== "idle"

  return (
    <div
      className={
        "site-intro" +
        (phase === "dropping" ? " site-intro--dropping" : "") +
        (phase === "leaving" ? " site-intro--leaving" : "")
      }
      role="presentation"
    >
      <BinaryField variant="intro" />

      <div className="site-intro__lockup">
        <SentrixWordmark />

        <button
          type="button"
          className="site-intro__coin-btn"
          aria-label="Enter Sentrix"
          onClick={enter}
          disabled={busy}
        >
          <span className="site-intro__coin">
            <BitcoinMedallion size={96} />
          </span>
        </button>

        <p className="site-intro__eyebrow">
          Blockchain Forensics <span aria-hidden="true">·</span> Investigator
          Workstation
        </p>
        <p className="site-intro__hint" aria-hidden="true">
          Click the coin to enter
        </p>
      </div>
    </div>
  )
}
