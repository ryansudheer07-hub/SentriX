import { scrollToSection } from "../scroll"
import { ACTION_TYPES, NAV_TARGETS, type AiAction } from "./types"
import type { GraphCommand } from "./context"

export interface ActionDeps {
  dispatchCommand?: (cmd: Omit<GraphCommand, "nonce">) => void
}

const NAV_SET = new Set<string>(NAV_TARGETS)
const TYPE_SET = new Set<string>(ACTION_TYPES)

export function isAllowedAction(a: unknown): a is AiAction {
  return (
    !!a &&
    typeof a === "object" &&
    typeof (a as AiAction).type === "string" &&
    TYPE_SET.has((a as AiAction).type)
  )
}

/**
 * Execute an assistant-returned action. Only the fixed allow-list is honoured;
 * `navigate` is limited to known section ids. Never evaluates code or touches
 * URLs.
 */
export function runAiAction(
  action: AiAction,
  deps: ActionDeps = {}
): { ok: boolean; note: string } {
  if (!isAllowedAction(action)) return { ok: false, note: "unsupported action" }

  switch (action.type) {
    case "navigate": {
      const target = action.target ?? ""
      if (!NAV_SET.has(target)) return { ok: false, note: `unknown target ${target}` }
      return { ok: scrollToSection(target), note: `navigate:${target}` }
    }
    case "open_address":
    case "focus_graph_node": {
      const addr = action.target ?? String(action.payload?.address ?? "")
      if (!addr) return { ok: false, note: "no address" }
      deps.dispatchCommand?.({
        focusAddress: addr,
        selectId: action.type === "focus_graph_node" ? addr : undefined,
      })
      scrollToSection("graph-view")
      return { ok: true, note: `graph:${addr}` }
    }
    case "filter_risk": {
      const raw = String(action.payload?.level ?? "all")
      const level = (["high", "medium", "low", "all"] as const).includes(
        raw as "high" | "medium" | "low" | "all"
      )
        ? (raw as "high" | "medium" | "low" | "all")
        : "all"
      deps.dispatchCommand?.({ riskFilter: level })
      scrollToSection("graph-view")
      return { ok: true, note: `filter:${level}` }
    }
    case "open_alert":
      return { ok: scrollToSection("alerts"), note: "alerts" }
    case "open_transaction":
      return { ok: scrollToSection("graph-view"), note: "graph" }
    default:
      return { ok: false, note: "unsupported action" }
  }
}
