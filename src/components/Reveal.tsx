"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"

type RevealProps = {
  children: ReactNode
  /** Stagger, in ms. */
  delay?: number
}

/**
 * Fades + eases its content up the first time it scrolls into view. Motion
 * only -- layout, spacing and size are untouched (the wrapper is a plain block
 * that stretches like the child it replaces). `prefers-reduced-motion` shows
 * everything immediately (see `.reveal` in globals.css).
 */
export function Reveal({ children, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // The observer's first callback reports the initial state, so content
    // already on screen reveals within a frame; the rest waits for scroll.
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

  return (
    <div
      ref={ref}
      className={"reveal" + (shown ? " reveal--in" : "")}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}
