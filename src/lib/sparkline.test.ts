import { describe, expect, it } from "vitest"

import { buildSparkline } from "./sparkline"

describe("buildSparkline", () => {
  it("is empty for no data", () => {
    const s = buildSparkline([], 100, 20)
    expect(s.points).toBe("")
    expect(s.area).toBe("")
  })

  it("spans the full width and inverts the y axis (min at the bottom)", () => {
    const s = buildSparkline([0, 5, 10], 100, 20, 2)
    // first x = pad, last x = width - pad
    expect(s.points.startsWith("2.0,")).toBe(true)
    expect(s.points.includes("98.0,")).toBe(true)
    // lowest value -> largest y, highest value -> smallest y
    expect(s.min).toBe(0)
    expect(s.max).toBe(10)
    expect(s.last).toEqual({ x: 98, y: 2 })
  })

  it("a rising series produces monotonically decreasing y", () => {
    const s = buildSparkline([1, 2, 3, 4, 5], 200, 40)
    const ys = s.points.split(" ").map((p) => Number(p.split(",")[1]))
    for (let i = 1; i < ys.length; i += 1) {
      expect(ys[i]).toBeLessThan(ys[i - 1])
    }
  })

  it("handles a flat series without dividing by zero", () => {
    const s = buildSparkline([7, 7, 7], 100, 20, 2)
    const ys = s.points.split(" ").map((p) => Number(p.split(",")[1]))
    expect(ys.every((y) => y === ys[0])).toBe(true)
    expect(Number.isFinite(ys[0])).toBe(true)
  })

  it("closes the area path back along the baseline", () => {
    const s = buildSparkline([1, 3, 2], 100, 20, 2)
    expect(s.area.endsWith("98.0,20 2.0,20")).toBe(true)
  })

  it("places a single point at the left pad", () => {
    const s = buildSparkline([42], 100, 20, 2)
    expect(s.last.x).toBe(2)
    expect(Number.isFinite(s.last.y)).toBe(true)
  })
})
