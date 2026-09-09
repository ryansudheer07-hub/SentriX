import { describe, expect, it } from "vitest"

import { buildAiRequestContext } from "./context"
import type { SentrixAIContext } from "./types"

describe("buildAiRequestContext", () => {
  it("returns null when there is nothing worth sending", () => {
    expect(buildAiRequestContext({}, undefined)).toBeNull()
    expect(
      buildAiRequestContext({ graphContext: { nodeCount: 0, edgeCount: 0 } }, undefined)
    ).toBeNull()
    expect(buildAiRequestContext({ selectedNode: { id: "" } }, undefined)).toBeNull()
  })

  it("emits a trimmed, snake_cased payload", () => {
    const ctx: SentrixAIContext = {
      route: "/",
      selectedAddress: "bc1qaddr",
      selectedTransaction: "txid123",
      selectedNode: {
        id: "bc1qaddr",
        riskScore: 87,
        riskLevel: "high",
        entityType: "mixer",
      },
      graphContext: { nodeCount: 12, edgeCount: 20, focusAddress: "bc1qaddr" },
    }
    expect(buildAiRequestContext(ctx, "investigator")).toEqual({
      route: "/",
      selected_address: "bc1qaddr",
      selected_transaction: "txid123",
      selected_node: {
        id: "bc1qaddr",
        risk_score: 87,
        risk_level: "high",
        entity_type: "mixer",
      },
      graph_context: {
        node_count: 12,
        edge_count: 20,
        focus_address: "bc1qaddr",
      },
      user_role: "investigator",
    })
  })

  it("keeps the graph block when only a focus address is set", () => {
    const out = buildAiRequestContext(
      { graphContext: { focusAddress: "bc1qfocus" } },
      undefined
    )
    expect(out).toEqual({
      graph_context: {
        node_count: undefined,
        edge_count: undefined,
        focus_address: "bc1qfocus",
      },
    })
  })

  it("omits selected_node without an id and still sends the role", () => {
    const out = buildAiRequestContext(
      { selectedNode: { id: "" }, route: "/" },
      "analyst"
    )
    expect(out).toEqual({ route: "/", user_role: "analyst" })
  })
})
