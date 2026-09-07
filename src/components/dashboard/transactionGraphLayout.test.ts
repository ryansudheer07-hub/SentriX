import { describe, expect, it } from "vitest"

import { layoutLayeredDag } from "./transactionGraphLayout"

const NODES = [
  { id: "source" },
  { id: "intermediate" },
  { id: "mixer" },
  { id: "exchange" },
  { id: "highrisk" },
]
const EDGES = [
  { from: "source", to: "intermediate" },
  { from: "source", to: "mixer" },
  { from: "mixer", to: "exchange" },
  { from: "mixer", to: "highrisk" },
]

describe("layoutLayeredDag", () => {
  const pos = layoutLayeredDag({ nodes: NODES, edges: EDGES })

  it("places every node", () => {
    expect(pos.size).toBe(NODES.length)
  })

  it("layers by longest path from a source", () => {
    expect(pos.get("source")!.layer).toBe(0)
    expect(pos.get("intermediate")!.layer).toBe(1)
    expect(pos.get("mixer")!.layer).toBe(1)
    expect(pos.get("exchange")!.layer).toBe(2)
    expect(pos.get("highrisk")!.layer).toBe(2)
  })

  it("maps layer to a left->right normalised x", () => {
    expect(pos.get("source")!.x).toBe(0)
    expect(pos.get("mixer")!.x).toBeCloseTo(0.5)
    expect(pos.get("highrisk")!.x).toBe(1)
  })

  it("keeps all coordinates within 0..1", () => {
    for (const p of pos.values()) {
      expect(p.x).toBeGreaterThanOrEqual(0)
      expect(p.x).toBeLessThanOrEqual(1)
      expect(p.y).toBeGreaterThan(0)
      expect(p.y).toBeLessThan(1)
    }
  })

  it("spreads a shared layer vertically", () => {
    const a = pos.get("intermediate")!.y
    const b = pos.get("mixer")!.y
    expect(a).not.toBe(b)
  })

  it("does not throw on an empty graph", () => {
    expect(() => layoutLayeredDag({ nodes: [], edges: [] })).not.toThrow()
  })
})
