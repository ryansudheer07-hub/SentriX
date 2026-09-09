import { describe, expect, it } from "vitest"

import {
  clamp01,
  cubicBezier,
  easeFluid,
  easeSoft,
  interpolate,
  tweenDuration,
} from "./tween"

describe("clamp01", () => {
  it("clamps to the unit interval", () => {
    expect(clamp01(-2)).toBe(0)
    expect(clamp01(0.4)).toBe(0.4)
    expect(clamp01(9)).toBe(1)
  })
})

describe("easeSoft", () => {
  it("pins the endpoints and eases out", () => {
    expect(easeSoft(0)).toBe(0)
    expect(easeSoft(1)).toBe(1)
    expect(easeSoft(0.5)).toBeGreaterThan(0.5) // decelerating
  })
})

describe("cubicBezier", () => {
  it("pins endpoints for any control points", () => {
    const f = cubicBezier(0.16, 1, 0.3, 1)
    expect(f(0)).toBe(0)
    expect(f(1)).toBe(1)
  })

  it("is monotonic across the range", () => {
    let prev = -Infinity
    for (let i = 0; i <= 20; i += 1) {
      const y = easeFluid(i / 20)
      expect(y).toBeGreaterThanOrEqual(prev - 1e-9)
      prev = y
    }
  })

  it("linear bezier ~ identity", () => {
    const linear = cubicBezier(0, 0, 1, 1)
    for (const x of [0.1, 0.25, 0.5, 0.75, 0.9]) {
      expect(linear(x)).toBeCloseTo(x, 2)
    }
  })

  it("front-loads progress for an ease-out curve", () => {
    expect(easeFluid(0.25)).toBeGreaterThan(0.25)
  })
})

describe("interpolate", () => {
  it("blends endpoints", () => {
    expect(interpolate(10, 20, 0)).toBe(10)
    expect(interpolate(10, 20, 1)).toBe(20)
    expect(interpolate(10, 20, 0.5)).toBe(15)
  })
})

describe("tweenDuration", () => {
  it("grows with the delta but stays capped", () => {
    expect(tweenDuration(0)).toBe(280)
    expect(tweenDuration(5)).toBe(310)
    expect(tweenDuration(1000)).toBe(520)
    expect(tweenDuration(-1000)).toBe(520) // magnitude, not sign
  })
})
