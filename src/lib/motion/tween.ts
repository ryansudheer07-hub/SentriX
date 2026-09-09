/**
 * Pure numeric-motion helpers. No DOM — the rAF loops that use these live in
 * the `components/motion/*` components; keeping the maths here makes it testable
 * and lets later phases (chart glide, graph physics) share one easing model.
 */

export const clamp01 = (t: number): number => (t < 0 ? 0 : t > 1 ? 1 : t)

/** Matches the site-wide `1 - (1 - t)^3` feel used by Lenis. */
export const easeSoft = (t: number): number => {
  const x = clamp01(t)
  return 1 - Math.pow(1 - x, 3)
}

/**
 * Solver for a CSS `cubic-bezier(x1, y1, x2, y2)` timing function (P0=(0,0),
 * P3=(1,1)). Returns y for a given progress x in [0,1]. Used where JS motion
 * needs to match a CSS `--ease-*` token exactly.
 */
export function cubicBezier(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): (t: number) => number {
  const cx = 3 * x1
  const bx = 3 * (x2 - x1) - cx
  const ax = 1 - cx - bx
  const cy = 3 * y1
  const by = 3 * (y2 - y1) - cy
  const ay = 1 - cy - by

  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t
  const slopeX = (t: number) => (3 * ax * t + 2 * bx) * t + cx

  const solve = (x: number) => {
    let t = x
    for (let i = 0; i < 8; i += 1) {
      const dx = sampleX(t) - x
      if (Math.abs(dx) < 1e-6) return t
      const d = slopeX(t)
      if (Math.abs(d) < 1e-6) break
      t -= dx / d
    }
    // Bisection fallback.
    let lo = 0
    let hi = 1
    t = x
    while (lo < hi) {
      const v = sampleX(t)
      if (Math.abs(v - x) < 1e-6) break
      if (v < x) lo = t
      else hi = t
      t = (lo + hi) / 2
    }
    return t
  }

  return (t: number) => {
    const x = clamp01(t)
    if (x === 0 || x === 1) return x
    return sampleY(solve(x))
  }
}

/** `--ease-fluid` — `cubic-bezier(0.22, 1, 0.36, 1)`. */
export const easeFluid = cubicBezier(0.22, 1, 0.36, 1)

export const interpolate = (from: number, to: number, t: number): number =>
  from + (to - from) * t

/**
 * A short, delta-scaled tween duration (ms): small changes settle fast, large
 * jumps take a touch longer but stay "controlled" per the brief (§10).
 */
export function tweenDuration(delta: number, base = 280, max = 520): number {
  return Math.min(max, base + Math.abs(delta) * 6)
}
