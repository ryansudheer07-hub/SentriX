"use client"

import { useEffect, useRef, useState } from "react"

import { easeSoft, interpolate, tweenDuration } from "@/lib/motion/tween"

type MotionNumberProps = {
  /** The target value. Changes are tweened, not snapped. */
  value: number
  /** How to render the interpolating number. Default: rounded integer. */
  format?: (n: number) => string
  /** Tween 0 → value once on first mount (for headline figures). */
  animateOnMount?: boolean
  className?: string
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches

/**
 * A number that glides between states (brief §10). SSR-safe: the server and the
 * first client render both show `format(value)`, so there is no hydration
 * mismatch; animation only ever runs from a client-side change (or an opt-in
 * mount tween). Honors `prefers-reduced-motion` by snapping.
 */
export function MotionNumber({
  value,
  format = (n) => String(Math.round(n)),
  animateOnMount = false,
  className,
}: MotionNumberProps) {
  const [display, setDisplay] = useState(value)
  const fromRef = useRef(value)
  const rafRef = useRef(0)
  const mountedRef = useRef(false)

  useEffect(() => {
    const first = !mountedRef.current
    mountedRef.current = true

    const from = first && animateOnMount ? 0 : fromRef.current
    const to = value

    if (from === to) {
      fromRef.current = to
      return
    }

    // A zero-length tween covers reduced motion: the first frame lands on `to`
    // with no interpolation, and the setState stays inside the rAF callback.
    const dur = prefersReducedMotion() ? 0 : tweenDuration(to - from)
    const start =
      typeof performance !== "undefined" ? performance.now() : Date.now()
    cancelAnimationFrame(rafRef.current)

    const tick = (now: number) => {
      const t = dur <= 0 ? 1 : Math.min(1, (now - start) / dur)
      setDisplay(interpolate(from, to, easeSoft(t)))
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        fromRef.current = to
      }
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(rafRef.current)
  }, [value, animateOnMount])

  return (
    <span
      className={"motion-number" + (className ? ` ${className}` : "")}
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      {format(display)}
    </span>
  )
}
