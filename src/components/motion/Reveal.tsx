"use client"

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react"

import { viewportProgress } from "@/lib/motion/scrollProgress"

type RevealProps = {
  children: ReactNode
  /** Entrance stagger, ms. */
  delay?: number
  /** Anchor id on the wrapper (scroll target). */
  id?: string
  /** Travel direction of the entrance. `"up"` (default) rises into place. */
  from?: "up" | "down" | "none"
  /** Travel distance in px for `up`/`down`. Default 22 (matches the original). */
  distance?: number
  /** Scale to grow from, e.g. `0.96`. Omitted = no scale. */
  scaleFrom?: number
  /**
   * While the wrapper is on screen, publish its 0..1 viewport progress as
   * `--reveal-p` for later phases to hang parallax / dimming on. Off by default
   * so the common case stays a single one-shot observer. Ignored under
   * `prefers-reduced-motion`.
   */
  track?: boolean
}

const REDUCED = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches

/**
 * Fades + eases its content into place the first time it scrolls into view.
 * Motion only — layout, spacing and size are untouched. `prefers-reduced-motion`
 * shows everything immediately (see `.reveal` in globals.css).
 */
export function Reveal({
  children,
  delay = 0,
  id,
  from = "up",
  distance = 22,
  scaleFrom,
  track = false,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  // One-shot entrance.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true)
          io.disconnect()
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Optional scroll-progress signal.
  useEffect(() => {
    if (!track) return
    const el = ref.current
    if (!el || REDUCED()) return

    let raf = 0
    let inView = false

    const loop = () => {
      const r = el.getBoundingClientRect()
      el.style.setProperty(
        "--reveal-p",
        viewportProgress(r.top, r.height, window.innerHeight).toFixed(4)
      )
      raf = inView ? requestAnimationFrame(loop) : 0
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting
        if (inView && !raf) raf = requestAnimationFrame(loop)
      },
      { threshold: [0, 0.01, 0.5, 1] }
    )
    io.observe(el)
    return () => {
      io.disconnect()
      if (raf) cancelAnimationFrame(raf)
    }
  }, [track])

  const dist = from === "none" ? 0 : from === "down" ? -distance : distance
  const vars: Record<string, string> = {}
  if (delay) vars.transitionDelay = `${delay}ms`
  if (dist !== 22) vars["--reveal-dist"] = `${dist}px`
  if (scaleFrom != null) vars["--reveal-scale"] = String(scaleFrom)

  return (
    <div
      ref={ref}
      id={id}
      className={"reveal" + (shown ? " reveal--in" : "")}
      style={Object.keys(vars).length ? (vars as CSSProperties) : undefined}
    >
      {children}
    </div>
  )
}
