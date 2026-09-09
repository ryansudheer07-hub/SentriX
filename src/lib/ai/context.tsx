"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import type { SentrixAIContext } from "./types"

export interface GraphCommand {
  focusAddress?: string
  selectId?: string
  riskFilter?: "high" | "medium" | "low" | "all"
  nonce: number
}

interface CtxValue {
  context: SentrixAIContext
  setContext: (patch: Partial<SentrixAIContext>) => void
  command: GraphCommand | null
  dispatchCommand: (cmd: Omit<GraphCommand, "nonce">) => void
}

const Ctx = createContext<CtxValue | null>(null)

/**
 * Lightweight store the assistant reads for "what is the user looking at" and
 * writes to when it wants the Graph View to focus an address / filter risk.
 * Deliberately small — not a mirror of the whole app state.
 */
export function SentrixContextProvider({ children }: { children: ReactNode }) {
  const [context, setState] = useState<SentrixAIContext>({})
  const [command, setCommand] = useState<GraphCommand | null>(null)

  const setContext = useCallback((patch: Partial<SentrixAIContext>) => {
    setState((prev) => ({ ...prev, ...patch }))
  }, [])

  const dispatchCommand = useCallback((cmd: Omit<GraphCommand, "nonce">) => {
    setCommand({ ...cmd, nonce: Date.now() })
  }, [])

  const value = useMemo(
    () => ({ context, setContext, command, dispatchCommand }),
    [context, setContext, command, dispatchCommand]
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useSentrixContext(): CtxValue {
  return (
    useContext(Ctx) ?? {
      context: {},
      setContext: () => {},
      command: null,
      dispatchCommand: () => {},
    }
  )
}

/** Trim the in-app context down to the structured payload the backend accepts. */
export function buildAiRequestContext(
  ctx: SentrixAIContext,
  role: string | undefined
): Record<string, unknown> | null {
  const out: Record<string, unknown> = {}
  if (ctx.route) out.route = ctx.route
  if (ctx.selectedAddress) out.selected_address = ctx.selectedAddress
  if (ctx.selectedTransaction) out.selected_transaction = ctx.selectedTransaction
  if (ctx.selectedNode?.id) {
    out.selected_node = {
      id: ctx.selectedNode.id,
      risk_score: ctx.selectedNode.riskScore,
      risk_level: ctx.selectedNode.riskLevel,
      entity_type: ctx.selectedNode.entityType,
    }
  }
  const g = ctx.graphContext
  if (g && (g.nodeCount || g.edgeCount || g.focusAddress)) {
    out.graph_context = {
      node_count: g.nodeCount,
      edge_count: g.edgeCount,
      focus_address: g.focusAddress,
    }
  }
  if (role) out.user_role = role
  return Object.keys(out).length ? out : null
}
