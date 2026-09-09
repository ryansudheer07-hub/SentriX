"use client"

import { useEffect } from "react"
import Lenis from "lenis"

/**
 * Site-wide inertial / eased scrolling. Real scroll position still moves (so
 * sticky headers, IntersectionObserver reveals and anchors all work) -- it
 * just glides. Disabled entirely for `prefers-reduced-motion`. Elements marked
 * `data-lenis-prevent` (the graph canvases) keep their own wheel behaviour.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      touchMultiplier: 1.6,
    })

    let raf = 0
    const loop = (time: number) => {
      lenis.raf(time)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
    }
  }, [])

  return null
}
