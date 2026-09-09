import { describe, expect, it } from "vitest"

import { chartGeometry, lerp, nearestIndex } from "./chart"

describe("chartGeometry", () => {
  it("is empty for no data", () => {
    const g = chartGeometry([], 100, 40)
    expect(g.pts).toEqual([])
    expect(g.line).toBe("")
  })

  it("spreads points across the inner width and inverts y", () => {
    const g = chartGeometry([10, 20, 30], 100, 40, 3)
    expect(g.pts[0].x).toBe(3)
    expect(g.pts[2].x).toBe(97)
    expect(g.pts[0].y).toBeGreaterThan(g.pts[2].y) // 10 sits lower than 30
    expect(g.pts.map((p) => p.i)).toEqual([0, 1, 2])
    expect(g.pts.map((p) => p.v)).toEqual([10, 20, 30])
  })

  it("keeps a flat series finite", () => {
    const g = chartGeometry([5, 5, 5], 100, 40)
    expect(g.pts.every((p) => Number.isFinite(p.y))).toBe(true)
  })

  it("closes the area along the baseline", () => {
    const g = chartGeometry([1, 2], 100, 40, 3)
    expect(g.area.endsWith("97.00,40 3.00,40")).toBe(true)
  })
})

describe("nearestIndex", () => {
  const g = chartGeometry([0, 1, 2, 3, 4], 100, 40, 0)

  it("snaps to the closest point by x", () => {
    expect(nearestIndex(g.pts, 0)).toBe(0)
    expect(nearestIndex(g.pts, 100)).toBe(4)
    expect(nearestIndex(g.pts, 51)).toBe(2)
    expect(nearestIndex(g.pts, 74)).toBe(3)
  })

  it("returns -1 for an empty series", () => {
    expect(nearestIndex([], 10)).toBe(-1)
  })
})

describe("lerp", () => {
  it("blends", () => {
    expect(lerp(0, 10, 0)).toBe(0)
    expect(lerp(0, 10, 1)).toBe(10)
    expect(lerp(0, 10, 0.25)).toBe(2.5)
  })
})
