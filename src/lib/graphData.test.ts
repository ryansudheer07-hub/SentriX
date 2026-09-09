import { describe, expect, it } from "vitest"

import { getAddressDetail, getGraphDataset } from "./graphData"
import { riskLevel } from "./graphTypes"

describe("riskLevel", () => {
  it("bands scores into high / medium / low", () => {
    expect(riskLevel(97)).toBe("high")
    expect(riskLevel(80)).toBe("high")
    expect(riskLevel(79)).toBe("medium")
    expect(riskLevel(50)).toBe("medium")
    expect(riskLevel(49)).toBe("low")
    expect(riskLevel(0)).toBe("low")
  })
})

describe("getGraphDataset", () => {
  it("returns a connected dataset by default", async () => {
    const ds = await getGraphDataset()
    expect(ds.nodes.length).toBeGreaterThan(0)
    expect(ds.edges.length).toBeGreaterThan(0)
    const ids = new Set(ds.nodes.map((n) => n.id))
    for (const edge of ds.edges) {
      expect(ids.has(edge.source)).toBe(true)
      expect(ids.has(edge.target)).toBe(true)
    }
  })

  it("filters nodes by minRisk", async () => {
    const ds = await getGraphDataset({ minRisk: 90 })
    expect(ds.nodes.every((n) => n.riskScore >= 90)).toBe(true)
  })

  it("caps at limit and flags truncation", async () => {
    const ds = await getGraphDataset({ limit: 2 })
    expect(ds.nodes).toHaveLength(2)
    expect(ds.truncated).toBe(true)
    // highest risk first
    expect(ds.nodes[0].riskScore).toBeGreaterThanOrEqual(ds.nodes[1].riskScore)
  })

  it("restricts to the neighbourhood of a focus address", async () => {
    const ds = await getGraphDataset({ focus: "EXCH…104", hops: 1 })
    expect(ds.nodes.some((n) => n.id === "EXCH…104")).toBe(true)
    // one hop from the exchange should be a small set
    expect(ds.nodes.length).toBeLessThan(6)
  })

  it("returns an empty dataset for an unknown focus address", async () => {
    const ds = await getGraphDataset({ focus: "does-not-exist" })
    expect(ds.nodes).toHaveLength(0)
    expect(ds.edges).toHaveLength(0)
  })
})

describe("getAddressDetail", () => {
  it("derives flows, connections and reuses existing alert / activity data", async () => {
    const detail = await getAddressDetail("3F9…Q81")
    expect(detail.riskLevel).toBe("high")
    expect(detail.incoming.length).toBeGreaterThan(0)
    expect(detail.outgoing.length).toBeGreaterThan(0)
    expect(detail.connectedAddresses.length).toBeGreaterThan(0)
    expect(detail.alerts.length).toBeGreaterThan(0) // matched from riskAlerts
    expect(detail.history.length).toBeGreaterThan(0) // matched from activity
    expect(detail.txCount).toBeGreaterThan(0)
  })

  it("leaves unavailable fields null rather than faking them", async () => {
    const detail = await getAddressDetail("1A7…K92")
    expect(detail.riskFactors).toBeNull()
    expect(detail.firstSeen).toBeNull()
    expect(detail.lastSeen).toBeNull()
  })

  it("throws for an unknown address", async () => {
    await expect(getAddressDetail("nope")).rejects.toThrow()
  })
})
