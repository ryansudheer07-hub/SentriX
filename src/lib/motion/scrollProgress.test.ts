import { describe, expect, it } from "vitest"

import { mapProgress, viewportProgress } from "./scrollProgress"

describe("viewportProgress", () => {
  const vh = 1000
  const h = 400

  it("is 0 as the element enters the bottom edge", () => {
    expect(viewportProgress(vh, h, vh)).toBeCloseTo(0, 5)
  })

  it("is 1 once the element has fully passed the top", () => {
    expect(viewportProgress(-h, h, vh)).toBeCloseTo(1, 5)
  })

  it("is ~0.5 when the element straddles the midpoint of its travel", () => {
    // travel spans vh + h = 1400; halfway is top = vh - 700 = 300
    expect(viewportProgress(300, h, vh)).toBeCloseTo(0.5, 5)
  })

  it("clamps outside the travel band and guards a zero viewport", () => {
    expect(viewportProgress(vh + 200, h, vh)).toBe(0)
    expect(viewportProgress(-h - 200, h, vh)).toBe(1)
    expect(viewportProgress(10, 10, 0)).toBe(0)
  })
})

describe("mapProgress", () => {
  it("remaps a unit progress into an output range", () => {
    expect(mapProgress(0, 0.4, 1)).toBe(0.4)
    expect(mapProgress(1, 0.4, 1)).toBe(1)
    expect(mapProgress(0.5, 0.4, 1)).toBeCloseTo(0.7, 5)
  })

  it("clamps its input", () => {
    expect(mapProgress(-1, 0.4, 1)).toBe(0.4)
    expect(mapProgress(2, 0.4, 1)).toBe(1)
  })
})
