"use client"

import { useEffect, useRef } from "react"

type BinaryFieldProps = {
  /** `ambient` = faint texture over the whole app; `intro` = denser, on the gate. */
  variant?: "ambient" | "intro"
}

const SETTINGS = {
  ambient: { cell: 22, font: 12, flipEvery: 11, flipFrac: 0.01, baseLo: 0.1, baseHi: 0.28 },
  intro: { cell: 22, font: 13, flipEvery: 7, flipFrac: 0.022, baseLo: 0.14, baseHi: 0.42 },
} as const

const GOLD = [212, 175, 55] as const
const GOLD_HOT = [246, 224, 150] as const

const HL_RADIUS = 84 // px around the cursor that lights up
const HL_BOOST = 0.95 // how much heat adds to a cell's alpha
const HEAT_DECAY = 0.935 // per frame -> trail fades over ~0.6s

/**
 * A field of 0/1 glyphs on a canvas. Digits flip in place on a timer (like
 * live code). The `intro` variant also lights up cells near the pointer and
 * leaves a short decaying trail; the `ambient` (dashboard) variant does not
 * track the cursor. `pointer-events` is off; never affects layout. Static
 * under `prefers-reduced-motion`.
 */
export function BinaryField({ variant = "ambient" }: BinaryFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const cfg = SETTINGS[variant]
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const rnd = Math.random

    let cols = 0
    let rows = 0
    let bits = new Uint8Array(0)
    let base = new Float32Array(0)
    let heat = new Float32Array(0)
    let hotPrev = new Uint8Array(0)
    let originX = 0
    let originY = 0

    let prevX = -1
    let prevY = -1
    let pendX = -1
    let pendY = -1
    let hasPending = false
    let anyHeat = false

    let frame = 0
    let raf = 0
    let disposed = false

    const paintCell = (i: number) => {
      const c = i % cols
      const r = (i - c) / cols
      const x = c * cfg.cell + 3
      const y = r * cfg.cell + cfg.font
      ctx.clearRect(x - 3, y - cfg.font, cfg.cell, cfg.cell)

      const h = heat[i]
      let a = base[i]
      let cr = GOLD[0]
      let cg = GOLD[1]
      let cb = GOLD[2]
      if (h > 0.008) {
        const m = h > 1 ? 1 : h
        a = Math.min(1, a + h * HL_BOOST)
        cr = GOLD[0] + (GOLD_HOT[0] - GOLD[0]) * m
        cg = GOLD[1] + (GOLD_HOT[1] - GOLD[1]) * m
        cb = GOLD[2] + (GOLD_HOT[2] - GOLD[2]) * m
      }
      ctx.fillStyle = `rgba(${cr | 0}, ${cg | 0}, ${cb | 0}, ${a})`
      ctx.fillText(bits[i] ? "1" : "0", x, y)
    }

    const paintAll = () => {
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight)
      ctx.font = `${cfg.font}px ui-monospace, "SF Mono", Menlo, Consolas, monospace`
      ctx.textBaseline = "alphabetic"
      for (let i = 0; i < bits.length; i += 1) paintCell(i)
    }

    const layout = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      canvas.width = Math.max(1, Math.floor(w * dpr))
      canvas.height = Math.max(1, Math.floor(h * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const rect = canvas.getBoundingClientRect()
      originX = rect.left
      originY = rect.top
      cols = Math.max(1, Math.ceil(w / cfg.cell) + 1)
      rows = Math.max(1, Math.ceil(h / cfg.cell) + 1)
      const n = cols * rows
      bits = new Uint8Array(n)
      base = new Float32Array(n)
      heat = new Float32Array(n)
      hotPrev = new Uint8Array(n)
      for (let i = 0; i < n; i += 1) {
        bits[i] = rnd() > 0.5 ? 1 : 0
        base[i] = cfg.baseLo + rnd() * (cfg.baseHi - cfg.baseLo)
      }
      paintAll()
    }

    // Spread heat along the segment prev -> cur so fast moves leave no gaps.
    const stampTrail = (x0: number, y0: number, x1: number, y1: number) => {
      const dist = Math.hypot(x1 - x0, y1 - y0)
      const steps = Math.min(28, Math.max(1, Math.floor(dist / (cfg.cell * 0.55))))
      const span = Math.ceil(HL_RADIUS / cfg.cell)
      for (let s = 0; s <= steps; s += 1) {
        const t = s / steps
        const x = x0 + (x1 - x0) * t
        const y = y0 + (y1 - y0) * t
        const cc = Math.floor(x / cfg.cell)
        const cRow = Math.floor(y / cfg.cell)
        for (let dr = -span; dr <= span; dr += 1) {
          const r = cRow + dr
          if (r < 0 || r >= rows) continue
          for (let dc = -span; dc <= span; dc += 1) {
            const c = cc + dc
            if (c < 0 || c >= cols) continue
            const gx = c * cfg.cell + cfg.cell / 2
            const gy = r * cfg.cell + cfg.font
            const d = Math.hypot(gx - x, gy - y)
            if (d > HL_RADIUS) continue
            const fall = 1 - d / HL_RADIUS
            const add = fall * fall * 1.7
            const i = r * cols + c
            if (add > heat[i]) heat[i] = add
          }
        }
      }
      anyHeat = true
    }

    const onPointerMove = (e: PointerEvent) => {
      pendX = e.clientX - originX
      pendY = e.clientY - originY
      hasPending = true
    }

    const tick = () => {
      if (disposed) return
      raf = window.requestAnimationFrame(tick)
      frame += 1

      if (hasPending) {
        if (prevX < 0) {
          prevX = pendX
          prevY = pendY
        }
        stampTrail(prevX, prevY, pendX, pendY)
        prevX = pendX
        prevY = pendY
        hasPending = false
      }

      if (frame % cfg.flipEvery === 0) {
        const k = Math.max(1, Math.floor(bits.length * cfg.flipFrac))
        for (let j = 0; j < k; j += 1) {
          const i = (rnd() * bits.length) | 0
          bits[i] = bits[i] ? 0 : 1
          base[i] = cfg.baseLo + rnd() * (cfg.baseHi - cfg.baseLo)
          paintCell(i)
        }
      }

      if (anyHeat) {
        let still = false
        for (let i = 0; i < heat.length; i += 1) {
          if (heat[i] > 0.006) {
            heat[i] *= HEAT_DECAY
            hotPrev[i] = 1
            paintCell(i)
            still = true
          } else if (hotPrev[i]) {
            heat[i] = 0
            hotPrev[i] = 0
            paintCell(i)
          }
        }
        anyHeat = still
      }
    }

    layout()

    let resizeT = 0
    const onResize = () => {
      window.clearTimeout(resizeT)
      resizeT = window.setTimeout(layout, 150)
    }
    window.addEventListener("resize", onResize)

    if (reduce) {
      return () => {
        window.removeEventListener("resize", onResize)
        window.clearTimeout(resizeT)
      }
    }

    // Cursor trail is only for the intro gate; the dashboard field just flips.
    if (variant === "intro") {
      window.addEventListener("pointermove", onPointerMove, { passive: true })
    }
    raf = window.requestAnimationFrame(tick)

    return () => {
      disposed = true
      window.cancelAnimationFrame(raf)
      window.clearTimeout(resizeT)
      window.removeEventListener("resize", onResize)
      window.removeEventListener("pointermove", onPointerMove)
    }
  }, [variant])

  return (
    <canvas
      ref={canvasRef}
      className={`binary-field binary-field--${variant}`}
      aria-hidden="true"
    />
  )
}
