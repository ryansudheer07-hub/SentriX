import { describe, expect, it } from "vitest"

import { hashString, seedSeries } from "./seed"

describe("hashString", () => {
  it("is deterministic", () => {
    expect(hashString("abc")).toBe(hashString("abc"))
  })

  it("differs for different inputs", () => {
    expect(hashString("abc")).not.toBe(hashString("abd"))
    expect(hashString("")).not.toBe(hashString("0"))
  })

  it("stays an unsigned 32-bit integer", () => {
    for (const s of ["", "x", "a very long transaction hash 0xdeadbeef…"]) {
      const h = hashString(s)
      expect(Number.isInteger(h)).toBe(true)
      expect(h).toBeGreaterThanOrEqual(0)
      expect(h).toBeLessThanOrEqual(0xffffffff)
    }
  })
})

describe("seedSeries", () => {
  const base = [10, 20, 30, 40, 50]

  it("keeps the length and is deterministic per seed", () => {
    const a = seedSeries(base, 123)
    const b = seedSeries(base, 123)
    expect(a).toEqual(b)
    expect(a).toHaveLength(base.length)
  })

  it("varies with the seed", () => {
    expect(seedSeries(base, 1)).not.toEqual(seedSeries(base, 2))
  })

  it("never emits a negative value", () => {
    for (let seed = 0; seed < 50; seed += 7) {
      expect(seedSeries(base, seed).every((v) => v >= 0)).toBe(true)
    }
  })

  it("is empty for an empty base", () => {
    expect(seedSeries([], 9)).toEqual([])
  })
})
