import { describe, expect, it, vi } from "vitest"

import {
  filterCommands,
  matchCommand,
  wrapIndex,
  type Command,
} from "./commands"

const cmd = (id: string, label: string): Command => ({
  id,
  label,
  run: vi.fn(),
})

describe("matchCommand", () => {
  it("matches an empty query against anything", () => {
    expect(matchCommand("Open Graph", "")).toBe(true)
    expect(matchCommand("Open Graph", "   ")).toBe(true)
  })

  it("is case-insensitive and substring-based", () => {
    expect(matchCommand("Show high-risk addresses", "HIGH")).toBe(true)
    expect(matchCommand("Show high-risk addresses", "risk addr")).toBe(true)
  })

  it("requires every term to be present", () => {
    expect(matchCommand("Open Alerts", "open graph")).toBe(false)
  })
})

describe("filterCommands", () => {
  const all = [
    cmd("overview", "Open Overview"),
    cmd("graph", "Open Network graph"),
    cmd("ai", "Ask SentriX AI"),
  ]

  it("returns everything for a blank query, in order", () => {
    expect(filterCommands(all, "").map((c) => c.id)).toEqual([
      "overview",
      "graph",
      "ai",
    ])
  })

  it("narrows to matches", () => {
    expect(filterCommands(all, "open").map((c) => c.id)).toEqual([
      "overview",
      "graph",
    ])
    expect(filterCommands(all, "sentrix").map((c) => c.id)).toEqual(["ai"])
  })

  it("can come back empty", () => {
    expect(filterCommands(all, "delete everything")).toEqual([])
  })
})

describe("wrapIndex", () => {
  it("wraps around both ends", () => {
    expect(wrapIndex(0, 3)).toBe(0)
    expect(wrapIndex(3, 3)).toBe(0)
    expect(wrapIndex(-1, 3)).toBe(2)
    expect(wrapIndex(4, 3)).toBe(1)
  })

  it("is safe for an empty list", () => {
    expect(wrapIndex(2, 0)).toBe(0)
  })
})
