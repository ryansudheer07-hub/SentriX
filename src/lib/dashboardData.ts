/**
 * Static content for the Sentrix command center.
 *
 * Everything the dashboard renders lives here as typed objects so a real
 * backend can replace these exports later without touching the components.
 * Values mirror the reference design.
 */

export type Tone = "gold" | "danger" | "ok" | "muted"

export interface NavItem {
  label: string
  active?: boolean
}

export const navItems: NavItem[] = [
  { label: "Overview", active: true },
  { label: "Network Intelligence" },
  { label: "Address Investigation" },
  { label: "Transactions" },
  { label: "Risk Analysis" },
  { label: "Monitoring" },
  { label: "Reports" },
]

export interface Stat {
  value: string
  label: string
  delta: string
  /** `danger` renders the value red and tints the cell. */
  tone: Extract<Tone, "gold" | "danger">
}

export const stats: Stat[] = [
  {
    value: "7.8M",
    label: "Transactions Analyzed",
    delta: "↑ 8.3% this week",
    tone: "gold",
  },
  {
    value: "18",
    label: "Active Investigations",
    delta: "6 requiring review",
    tone: "gold",
  },
  {
    value: "312",
    label: "High-Risk Addresses",
    delta: "+ 28 newly flagged",
    tone: "danger",
  },
  {
    value: "24,891",
    label: "Addresses Monitored",
    delta: "↑ 14.8% this week",
    tone: "gold",
  },
]

export const riskOverview = {
  score: 87,
  band: "HIGH RISK",
  note: "Multiple indicators detected across transaction behavior and network activity.",
}

export type GraphNodeTone = "source" | "neutral" | "mixer" | "danger"

export interface GraphNode {
  id: string
  label: string
  tone: GraphNodeTone
  /** Percentage position within the graph canvas. */
  x: number
  y: number
  size: number
}

export interface GraphEdge {
  from: string
  to: string
  tone: "gold" | "danger" | "faint"
}

export const graphLegend = [
  "Source",
  "Intermediate",
  "Mixer",
  "Exchange",
  "High-Risk Address",
]

export const graphNodes: GraphNode[] = [
  { id: "source", label: "SOURCE", tone: "source", x: 15, y: 63, size: 66 },
  { id: "intermediate", label: "INTERMEDIATE", tone: "neutral", x: 36, y: 27, size: 58 },
  { id: "mixer", label: "MIXER", tone: "mixer", x: 54, y: 66, size: 64 },
  { id: "exchange", label: "EXCHANGE", tone: "neutral", x: 72, y: 24, size: 58 },
  { id: "highrisk", label: "HIGH RISK", tone: "danger", x: 85, y: 70, size: 72 },
]

export const graphEdges: GraphEdge[] = [
  { from: "source", to: "intermediate", tone: "faint" },
  { from: "source", to: "mixer", tone: "gold" },
  { from: "mixer", to: "exchange", tone: "faint" },
  { from: "mixer", to: "highrisk", tone: "danger" },
]

export type AlertLevel = "CRITICAL" | "HIGH" | "MEDIUM"

export interface RiskAlert {
  level: AlertLevel
  address: string
  reason: string
  score: number
}

export const riskAlerts: RiskAlert[] = [
  {
    level: "CRITICAL",
    address: "3F9…Q81",
    reason: "Cluster association detected",
    score: 97,
  },
  {
    level: "HIGH",
    address: "bc1q…8x92",
    reason: "Mixer exposure detected",
    score: 94,
  },
  {
    level: "MEDIUM",
    address: "1A7…K92",
    reason: "Unusual transaction velocity",
    score: 71,
  },
]

export interface ExplainFactor {
  label: string
  weight: number
}

export const explainability = {
  question: "Why is this address high risk?",
  factors: [
    { label: "Transaction Graph Analysis", weight: 38 },
    { label: "Network Behavior", weight: 24 },
    { label: "Address Clustering", weight: 21 },
    { label: "Historical Risk Signals", weight: 17 },
  ] satisfies ExplainFactor[],
}

export type ActivityStatus = "FLAGGED" | "REVIEW" | "CLEARED"

export interface ActivityRow {
  time: string
  tx: string
  amount: string
  from: string
  to: string
  risk: number
  status: ActivityStatus
}

export const activity: ActivityRow[] = [
  {
    time: "14:42:19",
    tx: "b2c1…9e3f",
    amount: "3.847 BTC",
    from: "bc1q…2j8k",
    to: "3F9…Q81",
    risk: 97,
    status: "FLAGGED",
  },
  {
    time: "14:40:02",
    tx: "6d1a…42bc",
    amount: "0.912 BTC",
    from: "1A7…K92",
    to: "bc1q…8x92",
    risk: 71,
    status: "REVIEW",
  },
  {
    time: "14:37:46",
    tx: "ae89…11c4",
    amount: "12.400 BTC",
    from: "3F9…Q81",
    to: "EXCH…104",
    risk: 22,
    status: "CLEARED",
  },
]

export const suggestedQueries = [
  "Show high-risk addresses connected to this wallet",
  "Trace the flow of funds from this address",
  "Find addresses associated with mixer activity",
]

export const searchPlaceholder =
  "Search address, transaction hash, or ask Sentrix…"
