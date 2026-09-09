"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { BinaryField } from "./BinaryField"
import { BitcoinMedallion } from "./BitcoinMedallion"
import { BootWordmark } from "./intro/BootWordmark"
import { IntroDataTraces } from "./intro/IntroDataTraces"
import { IntroHud } from "./intro/IntroHud"
import { IntroNetwork } from "./intro/IntroNetwork"

const BOOT_READY_MS = 820 // system-init resolve → coin + CTA fade in
const DROP_TO_LEAVE_MS = 900 // cinematic coin launch
const LEAVE_TO_DONE_MS = 260 // fade to black → reveal login
const LEAVE_TO_DONE_MS_REDUCED = 200

type Phase = "boot" | "idle" | "dropping" | "leaving" | "done"

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches

/**
 * The Sentrix boot sequence ("blockchain forensics workstation initializing").
 * System-init logo resolve → a suspended Bitcoin artifact with a transaction-
 * detection pulse → cinematic coin launch → fade to the login layer. The coin
 * click (or "Skip intro", or Enter/Space on the focused coin) is ALWAYS what
 * advances it — nothing auto-navigates, and it plays the same every visit.
 * Reduced motion takes a short straight fade instead of the launch. Rendered on
 * the server so it is the first paint; page scroll is locked until it is gone.
 * No routing change — the overlay simply clears to reveal the existing login
 * screen underneath.
 */
export function SiteIntro() {
  const [phase, setPhase] = useState<Phase>("boot")
  const [ready, setReady] = useState(false)
  const [quick, setQuick] = useState(false)
  const advancing = useRef(false)

  const enter = useCallback(() => {
    if (advancing.current) return
    advancing.current = true
    const reduced = prefersReducedMotion()
    setQuick(reduced)
    setPhase(reduced ? "leaving" : "dropping")
  }, [])

  // System-init settles → interactive coin.
  useEffect(() => {
    if (phase !== "boot") return
    const t = window.setTimeout(
      () => {
        setReady(true)
        setPhase("idle")
      },
      prefersReducedMotion() ? 160 : BOOT_READY_MS
    )
    return () => window.clearTimeout(t)
  }, [phase])

  // dropping → leaving → done
  useEffect(() => {
    if (phase === "dropping") {
      const t = window.setTimeout(() => setPhase("leaving"), DROP_TO_LEAVE_MS)
      return () => window.clearTimeout(t)
    }
    if (phase === "leaving") {
      const ms =
        quick || prefersReducedMotion()
          ? LEAVE_TO_DONE_MS_REDUCED
          : LEAVE_TO_DONE_MS
      const t = window.setTimeout(() => setPhase("done"), ms)
      return () => window.clearTimeout(t)
    }
  }, [phase, quick])

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

  const interactive = phase === "idle"

  return (
    <div
      className={
        "site-intro" +
        (ready ? " site-intro--ready" : "") +
        (phase === "dropping" ? " site-intro--dropping" : "") +
        (phase === "leaving" ? " site-intro--leaving" : "")
      }
      role="presentation"
    >
      <div className="site-intro__field">
        <BinaryField variant="intro" />
        <span className="site-intro__scan" aria-hidden="true" />
        <IntroNetwork />
      </div>

      <IntroHud />
      <IntroDataTraces />

      <div className="site-intro__lockup">
        <BootWordmark />

        <p className="site-intro__eyebrow">
          Blockchain Forensics <span aria-hidden="true">·</span> Investigator
          Workstation
        </p>

        <div className="site-intro__coin-wrap">
          <span className="site-intro__pulse" aria-hidden="true" />
          <span
            className="site-intro__pulse site-intro__pulse--2"
            aria-hidden="true"
          />
          <button
            type="button"
            className="site-intro__coin-btn"
            aria-label="Initialize Sentrix workstation"
            onClick={enter}
            disabled={!interactive}
          >
            <span className="site-intro__coin">
              <BitcoinMedallion size={128} />
            </span>
          </button>
        </div>

        <p className="site-intro__cta">
          <span className="site-intro__cta-dot" aria-hidden="true" />
          Click the coin to initialize
        </p>

        <button
          type="button"
          className="site-intro__skip"
          onClick={enter}
          disabled={!interactive}
        >
          Skip intro
        </button>
      </div>
    </div>
  )
}
