/**
 * Types for the additive Graph View feature.
 *
 * These describe the data contract the graph / drill-down components consume.
 * `graphData.ts` holds the current dev fixture that satisfies it; a real
 * backend can replace that later without touching the components.
 */

export type RiskLevel = "high" | "medium" | "low"

/**
 * Single source of truth for turning a numeric risk score into a level.
 * Aligned with the existing alert semantics (CRITICAL/HIGH ~ high, MEDIUM ~
 * medium) and the LiveActivityTable tone thresholds.
 */
export function riskLevel(score: number): RiskLevel {
  if (score >= 80) return "high"
  if (score >= 50) return "medium"
  return "low"
}

/** Maps a risk level to an existing `globals.css` colour token. */
export const RISK_LEVEL_VAR: Record<RiskLevel, string> = {
  high: "--danger-2",
  medium: "--gold",
  low: "--ok",
}

export const RISK_LEVEL_LABEL: Record<RiskLevel, string> = {
  high: "High risk",
  medium: "Medium risk",
  low: "Low risk",
}

/** Existing `.pill--*` modifier that matches a level. */
export const RISK_LEVEL_PILL: Record<RiskLevel, string> = {
  high: "danger",
  medium: "warn",
  low: "ok",
}

export interface AddressNode {
  /** Canonical address string; also used as the graph node id. */
  id: string
  /** Short display form (may equal `id`). */
  label: string
  /** 0-100, from the existing risk model. */
  riskScore: number
  /** Entity category if known: exchange, mixer, service, wallet... */
  category?: string
}

export type TransactionDirection = "in" | "out"

export interface TransactionEdge {
  id: string
  /** From-address id. */
  source: string
  /** To-address id. */
  target: string
  /** Total value moved source -> target over the window, in BTC. */
  valueBtc: number
  /** Number of transactions aggregated into this edge. */
  txCount: number
  /** Highest risk score seen on this flow. */
  riskScore: number
}

export interface GraphDataset {
  nodes: AddressNode[]
  edges: TransactionEdge[]
  /** True when the backend capped the result -- show a "refine filters" hint. */
  truncated: boolean
  /** Opaque cursor for the next page, when the backend paginates. */
  nextCursor?: string
}

export interface GraphQuery {
  /** Address to centre the graph on; omitted = overview. */
  focus?: string
  /** Hops out from `focus`. */
  hops?: number
  /** Only include nodes at/above this risk score. */
  minRisk?: number
  /** Hard cap on node count returned. */
  limit?: number
  cursor?: string
}

export interface AddressFlow {
  address: string
  label: string
  valueBtc: number
  txCount: number
  riskScore: number
}

export interface AddressAlertRef {
  level: string
  reason: string
  score: number
}

export interface AddressHistoryItem {
  time: string
  tx: string
  direction: TransactionDirection
  counterparty: string
  amount: string
  risk: number
  status: string
}

/**
 * Drill-down contract for a single address. Fields the current fixture cannot
 * populate are typed `| null` and rendered as an explicit "pending backend"
 * state in the UI -- never faked.
 */
export interface AddressDetail {
  id: string
  label: string
  riskScore: number
  riskLevel: RiskLevel
  category: string | null
  txCount: number
  incoming: AddressFlow[]
  outgoing: AddressFlow[]
  connectedAddresses: AddressNode[]
  alerts: AddressAlertRef[]
  history: AddressHistoryItem[]
  /** Per-address risk factor breakdown -- null until the backend exposes it. */
  riskFactors: { label: string; weight: number }[] | null
  firstSeen: string | null
  lastSeen: string | null
  totalReceivedBtc: number | null
  totalSentBtc: number | null
}
