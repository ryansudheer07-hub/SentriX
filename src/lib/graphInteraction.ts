/**
 * Pure geometry for the SentriX graph spotlight interaction.
 *
 * Ported from the Framer code override `SentrixGraphInteraction`. This module
 * holds only the math so it can be unit-tested in isolation; the React glue
 * (rAF batching, in-view gating, CSS variable writes) lives in
 * `useSentrixGraphInteraction`.
 */

/** Visual tuning constants, kept identical to the original Framer override. */
export const GRAPH_INTERACTION = {
  /** Radius of the cursor spotlight, in px. */
  spotlightRadius: 220,
  /** Opacity of the spotlight while the pointer moves over the element. */
  moveAlpha: 0.14,
  /** Opacity of the spotlight on pointer enter (before the first move). */
  enterAlpha: 0.12,
  /** Opacity when the pointer is not over the element. */
  restAlpha: 0,
  /** Parallax translate range: (fraction - 0.5) * this, in px, per axis. */
  translateScale: 3,
  /** Where the spotlight gradient fully fades to transparent. */
  falloffStop: "68%",
  transition:
    "transform 360ms cubic-bezier(0.22, 1, 0.36, 1), background-image 420ms ease",
  willChange: "transform, background-image",
} as const

/** Neutral state used before any pointer interaction and on pointer leave. */
export const REST_POINT: GraphInteractionPoint = {
  x: 50,
  y: 50,
  tx: 0,
  ty: 0,
}

export interface GraphInteractionPoint {
  /** Spotlight centre X, as a percentage of element width (0-100). */
  x: number
  /** Spotlight centre Y, as a percentage of element height (0-100). */
  y: number
  /** Parallax translate X, in px. */
  tx: number
  /** Parallax translate Y, in px. */
  ty: number
}

/** Minimal shape of a DOMRect, so callers can pass a real rect or a stub. */
export interface RectLike {
  left: number
  top: number
  width: number
  height: number
}

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value))

/**
 * Map an absolute client pointer position to the spotlight/parallax state for
 * an element occupying `rect`.
 *
 * Returns `null` when the rect has no area (nothing sensible to compute).
 */
export function computeGraphInteraction(
  clientX: number,
  clientY: number,
  rect: RectLike
): GraphInteractionPoint | null {
  if (!rect.width || !rect.height) return null

  const fractionX = clamp01((clientX - rect.left) / rect.width)
  const fractionY = clamp01((clientY - rect.top) / rect.height)

  return {
    x: fractionX * 100,
    y: fractionY * 100,
    tx: (fractionX - 0.5) * GRAPH_INTERACTION.translateScale,
    ty: (fractionY - 0.5) * GRAPH_INTERACTION.translateScale,
  }
}

/**
 * Build the layered `background-image` value: the cursor spotlight on top of
 * whatever background the element already had.
 */
export function spotlightBackgroundImage(baseBackgroundImage?: string): string {
  const base =
    baseBackgroundImage && baseBackgroundImage !== "none"
      ? baseBackgroundImage
      : "none"

  return (
    `radial-gradient(${GRAPH_INTERACTION.spotlightRadius}px circle at ` +
    `var(--sentrix-x, 50%) var(--sentrix-y, 50%), ` +
    `rgba(255, 255, 255, var(--sentrix-a, 0)), ` +
    `rgba(255, 255, 255, 0) ${GRAPH_INTERACTION.falloffStop}), ${base}`
  )
}
