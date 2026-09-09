/**
 * Deterministic seeding for the Transaction Analysis surfaces. A typed query is
 * hashed and used to permute the fixture series so different transactions get
 * visually distinct charts — a presentation device, not chain data.
 */
export function hashString(s: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return h >>> 0
}

/**
 * Vary a base series by the seed with a smooth, bounded perturbation — a gain
 * plus a low-frequency wobble. No rotation, so the shape stays continuous (no
 * mid-series cliff).
 */
export function seedSeries(base: number[], seed: number): number[] {
  if (base.length === 0) return []
  // Avalanche-mix the seed so even adjacent seeds diverge.
  let s = (seed ^ 0x9e3779b9) >>> 0
  s = Math.imul(s ^ (s >>> 15), 0x85ebca6b) >>> 0
  s = Math.imul(s ^ (s >>> 13), 0xc2b2ae35) >>> 0
  s = (s ^ (s >>> 16)) >>> 0

  const gain = 0.88 + (s % 32) / 100 // 0.88 – 1.19
  const phase = ((s >>> 5) % 628) / 100 // 0 – 6.28 rad
  const wob = 0.05 + ((s >>> 15) % 14) / 100 // 0.05 – 0.18

  return base.map((v, i) => {
    const w = 1 + wob * Math.sin(i * 0.7 + phase)
    return Math.max(0, Math.round(v * gain * w * 10) / 10)
  })
}
