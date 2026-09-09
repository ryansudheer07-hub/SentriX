"use client"

import { useEffect } from "react"

import { decay, shouldIdle } from "@/lib/motion/pointer"

/**
 * The pointer-influence field (brief §6). Mounts once, renders nothing. One
 * passive `pointermove` listener + one rAF loop:
 *
 *   - writes `--ptr-x` / `--ptr-y` (px) and `--ptr-active` (1 on move, decaying
 *     to 0 ~1s after the last move) onto `<html>` — `BinaryField` reads these;
 *   - writes element-local `--gx` / `--gy` onto each primary glass surface so
 *     the `.glass-reactive::before` spotlight (globals.css) tracks the cursor.
 *
 * Fine-pointer only, and fully inert under `prefers-reduced-motion`.
 */
const REACTIVE_SELECTOR = ".panel, .topnav, .sai-panel, .glass-reactive"

export function PointerField() {
  useEffect(() => {
    const root = document.documentElement
    const reduceMq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const fineMq = window.matchMedia("(pointer: fine)")

    let raf = 0
    let last = 0
    let active = 0
    let px = window.innerWidth / 2
    let py = window.innerHeight * 0.4
    let pending = false
    let running = false

    const frame = (now: number) => {
      const dt = last ? now - last : 16
      last = now

      if (pending) {
        active = 1
        pending = false
      } else {
        active = decay(active, dt)
      }

      root.style.setProperty("--ptr-x", `${px.toFixed(1)}px`)
      root.style.setProperty("--ptr-y", `${py.toFixed(1)}px`)
      root.style.setProperty("--ptr-active", active.toFixed(3))

      if (active > 0.01) {
        const surfaces =
          document.querySelectorAll<HTMLElement>(REACTIVE_SELECTOR)
        for (let i = 0; i < surfaces.length; i += 1) {
          const el = surfaces[i]
          const r = el.getBoundingClientRect()
          if (r.width === 0 || r.height === 0) continue
          el.style.setProperty("--gx", `${(px - r.left).toFixed(1)}px`)
          el.style.setProperty("--gy", `${(py - r.top).toFixed(1)}px`)
        }
      }

      if (shouldIdle(active) && !pending) {
        running = false
        raf = 0
        return
      }
      raf = requestAnimationFrame(frame)
    }

    const kick = () => {
      if (running) return
      running = true
      last = 0
      raf = requestAnimationFrame(frame)
    }

    const onMove = (e: PointerEvent) => {
      px = e.clientX
      py = e.clientY
      pending = true
      kick()
    }

    const enable = () => {
      if (reduceMq.matches || !fineMq.matches) return
      window.addEventListener("pointermove", onMove, { passive: true })
    }
    const disable = () => {
      window.removeEventListener("pointermove", onMove)
      if (raf) cancelAnimationFrame(raf)
      raf = 0
      running = false
      active = 0
      root.style.setProperty("--ptr-active", "0")
    }
    const onPrefChange = () => {
      disable()
      enable()
    }

    enable()
    reduceMq.addEventListener("change", onPrefChange)
    fineMq.addEventListener("change", onPrefChange)

    return () => {
      reduceMq.removeEventListener("change", onPrefChange)
      fineMq.removeEventListener("change", onPrefChange)
      disable()
    }
  }, [])

  return null
}
