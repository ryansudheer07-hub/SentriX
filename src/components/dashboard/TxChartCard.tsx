"use client"

import { useRef, type PointerEvent as ReactPointerEvent } from "react"

import { IntelligenceChart } from "@/components/charts/IntelligenceChart"
import { MotionNumber } from "@/components/motion/MotionNumber"

type Pos = "left" | "center" | "right"

type TxChartCardProps = {
  pos: Pos
  label: string
  unit: string
  stat: number
  values: number[]
}

const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches

/**
 * One card in the Transaction Analysis fan. The card sits in a 3D-perspective
 * row (centre flat, sides rotated and pushed toward the viewer). On hover it
 * tilts a few degrees toward the cursor and a sheen tracks the pointer; both
 * are off under reduced motion. rAF-throttled, writes CSS custom properties
 * only — no React re-render per move.
 */
export function TxChartCard({ pos, label, unit, stat, values }: TxChartCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const raf = useRef(0)

  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (reducedMotion()) return
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const nx = (e.clientX - r.left) / r.width - 0.5
    const ny = (e.clientY - r.top) / r.height - 0.5
    cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(() => {
      el.style.setProperty("--hx", `${(nx * 12).toFixed(2)}deg`)
      el.style.setProperty("--hy", `${(-ny * 9).toFixed(2)}deg`)
      el.style.setProperty("--hl", `${(50 + nx * 55).toFixed(1)}%`)
      el.style.setProperty("--hlift", "-6px")
    })
  }

  const reset = () => {
    const el = ref.current
    if (!el) return
    cancelAnimationFrame(raf.current)
    el.style.setProperty("--hx", "0deg")
    el.style.setProperty("--hy", "0deg")
    el.style.setProperty("--hl", "50%")
    el.style.setProperty("--hlift", "0px")
  }

  return (
    <div
      ref={ref}
      className={`tx-card tx-card--${pos}`}
      onPointerMove={onMove}
      onPointerLeave={reset}
    >
      <div className="tx-card__inner glass glass--2">
        <div className="tx-card__sheen" aria-hidden="true" />
        <p className="tx-card__label">{label}</p>
        <p className="tx-card__stat">
          <MotionNumber value={stat} animateOnMount />
          <span className="tx-card__unit">{unit}</span>
        </p>
        <IntelligenceChart
          values={values}
          label={label}
          className="tx-card__chart"
        />
      </div>
    </div>
  )
}
