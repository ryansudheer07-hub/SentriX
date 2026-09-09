"use client"

import { useId, useMemo, useState, type CSSProperties } from "react"

import { chartGeometry, nearestIndex } from "@/lib/chart"

const VW = 300
const VH = 92
const PAD = 8

type IntelligenceChartProps = {
  /** Series, oldest → newest. */
  values: number[]
  /** How to render a value in the tooltip. */
  format?: (v: number) => string
  /** Accessible summary. */
  label?: string
  className?: string
}

/**
 * Reusable chart primitive (brief §9/§10/§30). Gradient-filled area + glow line,
 * a cursor crosshair that snaps to the nearest point, and a glass tooltip that
 * **glides** between points (CSS transition on a transform — no teleport).
 * Keyboard-navigable. Reduced motion removes the glide.
 */
export function IntelligenceChart({
  values,
  format = (v) => String(Math.round(v)),
  label,
  className,
}: IntelligenceChartProps) {
  const geo = useMemo(() => chartGeometry(values, VW, VH, PAD), [values])
  const [active, setActive] = useState<number | null>(null)
  const rawId = useId()
  const fillId = `icf${rawId.replace(/[^a-zA-Z0-9]/g, "")}`

  if (geo.pts.length < 2) {
    return (
      <p className={"ic ic--empty" + (className ? ` ${className}` : "")}>
        {label ? `${label} — ` : ""}pending backend
      </p>
    )
  }

  const at = active == null ? null : geo.pts[active]
  const summary = `${label ?? "Series"}: ${format(
    values[values.length - 1]
  )}, range ${format(geo.min)}–${format(geo.max)}`

  const anchor = at ?? geo.pts[geo.pts.length - 1]
  const vars = {
    "--icx": `${anchor.x.toFixed(2)}px`,
    "--icy": `${anchor.y.toFixed(2)}px`,
  } as CSSProperties

  return (
    <div className={"ic" + (className ? ` ${className}` : "")}>
      <svg
        className="ic__svg"
        viewBox={`0 0 ${VW} ${VH}`}
        style={vars}
        data-active={at ? "" : undefined}
        role="img"
        aria-label={summary}
      >
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.32" />
            <stop offset="70%" stopColor="var(--gold)" stopOpacity="0.05" />
            <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <line
          className="ic__base"
          x1="0"
          x2={VW}
          y1={VH - 0.5}
          y2={VH - 0.5}
        />
        <polygon
          className="ic__area"
          points={geo.area}
          fill={`url(#${fillId})`}
        />
        <polyline className="ic__line" points={geo.line} />

        <line className="ic__cross" x1="0" x2="0" y1="0" y2={VH} />
        <circle className="ic__dot" cx="0" cy="0" r="3.4" />

        {at && (
          <g className="ic__tip">
            <rect x="-34" y="-34" width="68" height="22" rx="6" />
            <text x="0" y="-19" textAnchor="middle">
              {format(at.v)}
            </text>
          </g>
        )}

        <rect
          className="ic__hit"
          x="0"
          y="0"
          width={VW}
          height={VH}
          tabIndex={0}
          aria-label={`${label ?? "Chart"}. Arrow keys to inspect points.`}
          onPointerMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect()
            setActive(nearestIndex(geo.pts, ((e.clientX - r.left) / r.width) * VW))
          }}
          onPointerLeave={() => setActive(null)}
          onFocus={() => setActive(geo.pts.length - 1)}
          onBlur={() => setActive(null)}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
              e.preventDefault()
              setActive((i) => {
                const cur = i ?? geo.pts.length - 1
                const next = cur + (e.key === "ArrowRight" ? 1 : -1)
                return Math.max(0, Math.min(geo.pts.length - 1, next))
              })
            }
          }}
        />
      </svg>
    </div>
  )
}
