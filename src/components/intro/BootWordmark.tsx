"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { SentrixWordmark } from "../SentrixWordmark"

const RESTING = "Sentrix"

/**
 * Discrete transliterations of the mark — leet, Hebrew, Cyrillic, Greek,
 * Katakana, bracketed, ₿-prefixed. The visible wordmark cycles through these,
 * not a random glyph pool, and always returns to the mark.
 */
const SIGNAL_VARIANTS = [
  "S3NTR1X",
  "SENTR1X",
  "סנטריקס",
  "СЕНТРИКС",
  "ΣΞΝΤЯΙΧ",
  "セントリクス",
  "⟦SΞNTRIX⟧",
  "SENTRIX",
  "₿ΣNTRIX",
]

const STEP_MS = 115
const STEPS = 8
const PERIOD_MS = 9600

const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches

/**
 * The intro wordmark. At rest it is the plain gradient "Sentrix". Every ~7.2s a
 * short signal cycle mounts two solid-gold layers that crossfade (opacity +
 * blur ease) so each transliteration dissolves smoothly into the next, then it
 * settles back to the gradient mark. A hidden sizer pins the box to "Sentrix"
 * width so nothing below reflows. Autonomous (not hover-triggered), `aria-label`
 * fixed to "Sentrix", `<bdi>` so an RTL variant keeps its own direction. Fully
 * inert under `prefers-reduced-motion`.
 */
export function BootWordmark() {
  const [textA, setTextA] = useState(RESTING)
  const [textB, setTextB] = useState("")
  const [active, setActive] = useState<"a" | "b">("a")
  const [cycling, setCycling] = useState(false)
  const [shown, setShown] = useState(false)
  const activeRef = useRef<"a" | "b">("a")

  const show = useCallback((s: string) => {
    const next = activeRef.current === "a" ? "b" : "a"
    if (next === "a") setTextA(s)
    else setTextB(s)
    activeRef.current = next
    setActive(next)
  }, [])

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    if (reducedMotion()) return
    let sequence = 0
    let tail = 0

    const runCycle = () => {
      window.clearInterval(sequence)
      window.clearTimeout(tail)
      activeRef.current = "a"
      setActive("a")
      setTextA(RESTING)
      setTextB("")
      setCycling(true)
      let step = 0
      sequence = window.setInterval(() => {
        show(
          step >= STEPS
            ? RESTING
            : SIGNAL_VARIANTS[step % SIGNAL_VARIANTS.length]
        )
        step += 1
        if (step > STEPS) {
          window.clearInterval(sequence)
          tail = window.setTimeout(() => setCycling(false), 240)
        }
      }, STEP_MS)
    }

    // one cycle right after the wordmark settles in, then on the interval
    const first = window.setTimeout(runCycle, 450)
    const period = window.setInterval(runCycle, PERIOD_MS)

    return () => {
      window.clearTimeout(first)
      window.clearInterval(period)
      window.clearInterval(sequence)
      window.clearTimeout(tail)
    }
  }, [show])

  return (
    <SentrixWordmark
      animate={false}
      aria-label="Sentrix"
      className={"boot-word" + (shown ? " boot-word--in" : "")}
    >
      {cycling ? (
        <span className="boot-word__stack">
          <span className="boot-word__size" aria-hidden="true">
            {RESTING}
          </span>
          <bdi
            className={"boot-word__layer" + (active === "a" ? " is-on" : "")}
          >
            {textA}
          </bdi>
          <bdi
            className={"boot-word__layer" + (active === "b" ? " is-on" : "")}
          >
            {textB}
          </bdi>
        </span>
      ) : (
        RESTING
      )}
    </SentrixWordmark>
  )
}
