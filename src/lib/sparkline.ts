/**
 * Pure sparkline geometry — turns a series of numbers into an SVG polyline (and
 * a matching filled area). No DOM. Shared by the Risk Core trajectory now and
 * the Phase 4 chart primitive later.
 */
export interface SparkPoint {
  x: number
  y: number
}

export interface Sparkline {
  /** `x,y x,y …` for a <polyline points>. */
  points: string
  /** The polyline plus a baseline, for a filled <polygon points>. */
  area: string
  last: SparkPoint
  min: number
  max: number
}

export function buildSparkline(
  values: number[],
  width: number,
  height: number,
  pad = 2
): Sparkline {
  if (values.length === 0) {
    return { points: "", area: "", last: { x: 0, y: 0 }, min: 0, max: 0 }
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const innerW = width - pad * 2
  const innerH = height - pad * 2
  const stepX = values.length > 1 ? innerW / (values.length - 1) : 0

  const pts: SparkPoint[] = values.map((v, i) => ({
    x: pad + i * stepX,
    y: pad + (1 - (v - min) / span) * innerH,
  }))

  const points = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")
  const first = pts[0]
  const last = pts[pts.length - 1]
  const area = `${points} ${last.x.toFixed(1)},${height} ${first.x.toFixed(1)},${height}`

  return { points, area, last, min, max }
}
