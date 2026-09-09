export type ChatRole = "user" | "assistant"

export interface AiSource {
  type: string
  id: string
  label?: string | null
}

export const ACTION_TYPES = [
  "navigate",
  "open_address",
  "open_transaction",
  "focus_graph_node",
  "filter_risk",
  "open_alert",
] as const
export type AiActionType = (typeof ACTION_TYPES)[number]

export interface AiAction {
  type: AiActionType
  target?: string | null
  payload?: Record<string, unknown> | null
}

export interface ChatMessage {
  id: string
  role: ChatRole
  text: string
  at: number
  sources?: AiSource[]
  actions?: AiAction[]
  error?: boolean
}

/** Section ids the assistant is allowed to scroll the dashboard to. */
export const NAV_TARGETS = [
  "overview",
  "graph-view",
  "alerts",
  "explainability",
  "activity",
  "risk-overview",
] as const
export type NavTarget = (typeof NAV_TARGETS)[number]

export interface SentrixAIContext {
  route?: string
  selectedAddress?: string
  selectedTransaction?: string
  selectedNode?: {
    id: string
    riskScore?: number
    riskLevel?: string
    entityType?: string
  }
  graphContext?: {
    nodeCount?: number
    edgeCount?: number
    focusAddress?: string
  }
}

export interface ChatResponse {
  conversation_id: string
  message: string
  sources: AiSource[]
  actions: AiAction[]
  provider: string
}

export interface AiStatus {
  enabled: boolean
  provider: string
  model: string
  has_api_key: boolean
  max_tool_calls: number
}
