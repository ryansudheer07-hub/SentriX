import { describe, expect, it, vi } from "vitest"

import { isAllowedAction, runAiAction } from "./actions"
import { ACTION_TYPES } from "./types"

describe("isAllowedAction", () => {
  it("accepts every declared action type", () => {
    for (const type of ACTION_TYPES) {
      expect(isAllowedAction({ type })).toBe(true)
    }
  })

  it("rejects anything not on the allow-list", () => {
    expect(isAllowedAction(null)).toBe(false)
    expect(isAllowedAction(undefined)).toBe(false)
    expect(isAllowedAction("navigate")).toBe(false)
    expect(isAllowedAction({})).toBe(false)
    expect(isAllowedAction({ type: 123 })).toBe(false)
    expect(isAllowedAction({ type: "eval" })).toBe(false)
    expect(isAllowedAction({ type: "open_url" })).toBe(false)
    expect(isAllowedAction({ type: "run_query" })).toBe(false)
  })
})

describe("runAiAction", () => {
  it("refuses an unsupported action outright", () => {
    // @ts-expect-error — deliberately invalid
    expect(runAiAction({ type: "exec_shell" })).toEqual({
      ok: false,
      note: "unsupported action",
    })
  })

  it("rejects navigate to an unknown section id", () => {
    const res = runAiAction({ type: "navigate", target: "http://evil.example" })
    expect(res.ok).toBe(false)
    expect(res.note).toContain("unknown target")
  })

  it("routes navigate to a known section id (no-ops without a DOM)", () => {
    const res = runAiAction({ type: "navigate", target: "graph-view" })
    expect(res.note).toBe("navigate:graph-view")
    // no document in the node test env, so the scroll can't land
    expect(res.ok).toBe(false)
  })

  it("open_address dispatches a focus command", () => {
    const dispatchCommand = vi.fn()
    const res = runAiAction(
      { type: "open_address", target: "bc1qexample" },
      { dispatchCommand }
    )
    expect(res).toEqual({ ok: true, note: "graph:bc1qexample" })
    expect(dispatchCommand).toHaveBeenCalledWith({
      focusAddress: "bc1qexample",
      selectId: undefined,
    })
  })

  it("focus_graph_node also selects the node", () => {
    const dispatchCommand = vi.fn()
    runAiAction(
      { type: "focus_graph_node", target: "bc1qnode" },
      { dispatchCommand }
    )
    expect(dispatchCommand).toHaveBeenCalledWith({
      focusAddress: "bc1qnode",
      selectId: "bc1qnode",
    })
  })

  it("open_address with no address is rejected", () => {
    const dispatchCommand = vi.fn()
    const res = runAiAction({ type: "open_address" }, { dispatchCommand })
    expect(res).toEqual({ ok: false, note: "no address" })
    expect(dispatchCommand).not.toHaveBeenCalled()
  })

  it("filter_risk passes a valid level through", () => {
    const dispatchCommand = vi.fn()
    const res = runAiAction(
      { type: "filter_risk", payload: { level: "high" } },
      { dispatchCommand }
    )
    expect(res).toEqual({ ok: true, note: "filter:high" })
    expect(dispatchCommand).toHaveBeenCalledWith({ riskFilter: "high" })
  })

  it("filter_risk clamps an unknown level to 'all'", () => {
    const dispatchCommand = vi.fn()
    runAiAction(
      { type: "filter_risk", payload: { level: "wipe-database" } },
      { dispatchCommand }
    )
    expect(dispatchCommand).toHaveBeenCalledWith({ riskFilter: "all" })
  })
})
