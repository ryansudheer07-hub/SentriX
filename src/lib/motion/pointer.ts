/**
 * Pure helpers for the pointer-influence field. The listener + rAF loop live in
 * `components/motion/PointerField.tsx`; this is the frame maths.
 */

export const clamp = (n: number, lo: number, hi: number): number =>
  n < lo ? lo : n > hi ? hi : n

/**
 * Exponential decay of the pointer "activity" value toward 0. `dt` and
 * `halfLifeMs` are in the same unit; after `halfLifeMs` the value is halved.
 */
export function decay(active: number, dt: number, halfLifeMs = 180): number {
  if (active <= 0) return 0
  if (dt <= 0) return active
  return active * Math.pow(0.5, dt / halfLifeMs)
}

/** Below this the field is invisible — the rAF loop can park until the next move. */
export function shouldIdle(active: number): boolean {
  return active < 0.002
}
