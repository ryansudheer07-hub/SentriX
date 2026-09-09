import { describe, expect, it } from "vitest"

import { clamp, decay, shouldIdle } from "./pointer"

describe("clamp", () => {
  it("bounds a value", () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-1, 0, 10)).toBe(0)
    expect(clamp(11, 0, 10)).toBe(10)
  })
})

describe("decay", () => {
  it("halves the value over one half-life", () => {
    expect(decay(1, 180, 180)).toBeCloseTo(0.5, 5)
    expect(decay(1, 360, 180)).toBeCloseTo(0.25, 5)
  })

  it("is a no-op for non-positive dt and clamps a spent value", () => {
    expect(decay(0.8, 0, 180)).toBe(0.8)
    expect(decay(0, 100, 180)).toBe(0)
    expect(decay(-0.1, 100, 180)).toBe(0)
  })

  it("never goes negative", () => {
    let v = 1
    for (let i = 0; i < 200; i += 1) v = decay(v, 16, 180)
    expect(v).toBeGreaterThanOrEqual(0)
    expect(v).toBeLessThan(0.002)
  })
})

describe("shouldIdle", () => {
  it("trips once the field is effectively invisible", () => {
    expect(shouldIdle(0.5)).toBe(false)
    expect(shouldIdle(0.0019)).toBe(true)
    expect(shouldIdle(0)).toBe(true)
  })
})
