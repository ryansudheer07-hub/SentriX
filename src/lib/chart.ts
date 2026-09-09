/**
 * Pure geometry for the intelligence chart primitive (brief §9/§10/§30). No
 * DOM — the component owns pointer tracking and the rAF glide; this maps a
 * numeric series into a viewBox and answers "which point is nearest x".
 */
export interface ChartPoint {
  /** Index in the source series. */
  i: number
  /** Source value. */
  v: number
  x: number
  y: number
}

export interface ChartGeometry {
  pts: ChartPoint[]
  /** `x,y …` for a <polyline>. */
  line: string
  /** line + baseline, for a filled <polygon>. */
  area: string
  min: number
  max: number
  width: number
  height: number
}

export function chartGeometry(
  values: number[],
  width: number,
  height: number,
  pad = 3
): ChartGeometry {
  if (values.length === 0) {
    return { pts: [], line: "", area: "", min: 0, max: 0, width, height }
  }
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const innerW = width - pad * 2
  const innerH = height - pad * 2
  const stepX = values.length > 1 ? innerW / (values.length - 1) : 0

  const pts: ChartPoint[] = values.map((v, i) => ({
    i,
    v,
    x: pad + i * stepX,
    y: pad + (1 - (v - min) / span) * innerH,
  }))
  const line = pts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ")
  const first = pts[0]
  const last = pts[pts.length - 1]
  const area = `${line} ${last.x.toFixed(2)},${height} ${first.x.toFixed(2)},${height}`
  return { pts, line, area, min, max, width, height }
}

/** Index of the point whose x is closest to `x`; -1 for an empty series. */
export function nearestIndex(pts: ChartPoint[], x: number): number {
  if (pts.length === 0) return -1
  let best = 0
  let bestD = Infinity
  for (const p of pts) {
    const d = Math.abs(p.x - x)
    if (d < bestD) {
      bestD = d
      best = p.i
    }
  }
  return best
}

export const lerp = (from: number, to: number, t: number): number =>
  from + (to - from) * t
