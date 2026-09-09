/**
 * Pure viewport-progress maths for the scroll-driven `Reveal`. Kept DOM-free so
 * later phases can drive cross-surface choreography (dimming, parallax) off the
 * same 0..1 signal.
 */

import { clamp01 } from "./tween"

/**
 * Progress of an element through the viewport, 0..1:
 *   0  → element top sits at the bottom edge (`top === vh`), just entering
 *   1  → element has fully passed the top edge (`top === -height`)
 * Linear in between; clamped outside.
 */
export function viewportProgress(
  top: number,
  height: number,
  vh: number
): number {
  const span = vh + height
  if (span <= 0) return 0
  return clamp01((vh - top) / span)
}

/** Remap a 0..1 progress into `[outMin, outMax]` (e.g. opacity 0.4 → 1). */
export function mapProgress(p: number, outMin: number, outMax: number): number {
  return outMin + (outMax - outMin) * clamp01(p)
}
