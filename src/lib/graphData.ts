/**
 * Dev fixture for the Graph View, in the same spirit as `dashboardData.ts`:
 * typed objects that a real backend can replace without touching components.
 *
 * The fixture is built from the SAME entities the dashboard already shows
 * (`riskAlerts`, `activity` in `dashboardData.ts`) so node styling, the risk
 * table and the drill-down all agree on one risk model.
 *
 * REQUIRED BACKEND CONTRACT (not yet implemented):
 *   GET /api/graph?focus&hops&minRisk&limit&cursor   -> GraphDataset
 *   GET /api/addresses/{id}                           -> AddressDetail
 * Replace `getGraphDataset` / `getAddressDetail` below with calls to that API.
 */

import { activity, riskAlerts } from "./dashboardData"
import {
  riskLevel,
  type AddressDetail,
  type AddressFlow,
  type AddressNode,
  type GraphDataset,
  type GraphQuery,
  type TransactionEdge,
} from "./graphTypes"

const DEFAULT_LIMIT = 50
const DEFAULT_HOPS = 2
const LATENCY_MS = 260

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/** Addresses. `id === label`; scores come from the existing alert data where
 *  an alert exists, otherwise a fixture value consistent with that entity. */
const FIXTURE_NODES: AddressNode[] = [
  { id: "3F9…Q81", label: "3F9…Q81", riskScore: 97, category: "unknown" },
  { id: "3Mix…A2c", label: "3Mix…A2c", riskScore: 88, category: "mixer" },
  { id: "bc1q…8x92", label: "bc1q…8x92", riskScore: 94, category: "mixer" },
  { id: "1A7…K92", label: "1A7…K92", riskScore: 71, category: "wallet" },
  { id: "bc1q…2j8k", label: "bc1q…2j8k", riskScore: 63, category: "wallet" },
  { id: "1Src…9dK", label: "1Src…9dK", riskScore: 41, category: "wallet" },
  { id: "EXCH…104", label: "EXCH…104", riskScore: 18, category: "exchange" },
]

const FIXTURE_EDGES: TransactionEdge[] = [
  // ---- real flows, straight from `activity` in dashboardData.ts ----
  { id: "e:1Src…9dK->bc1q…2j8k", source: "1Src…9dK", target: "bc1q…2j8k", valueBtc: 5.2, txCount: 3, riskScore: 44 },
  { id: "e:bc1q…2j8k->3F9…Q81", source: "bc1q…2j8k", target: "3F9…Q81", valueBtc: 3.847, txCount: 1, riskScore: 97 },
  { id: "e:3F9…Q81->3Mix…A2c", source: "3F9…Q81", target: "3Mix…A2c", valueBtc: 8.4, txCount: 4, riskScore: 91 },
  { id: "e:3Mix…A2c->1A7…K92", source: "3Mix…A2c", target: "1A7…K92", valueBtc: 2.1, txCount: 2, riskScore: 80 },
  { id: "e:1A7…K92->bc1q…8x92", source: "1A7…K92", target: "bc1q…8x92", valueBtc: 0.912, txCount: 1, riskScore: 71 },
  { id: "e:bc1q…8x92->EXCH…104", source: "bc1q…8x92", target: "EXCH…104", valueBtc: 1.7, txCount: 2, riskScore: 66 },
  { id: "e:3F9…Q81->EXCH…104", source: "3F9…Q81", target: "EXCH…104", valueBtc: 12.4, txCount: 1, riskScore: 22 },
]

function nodeMap(): Map<string, AddressNode> {
  return new Map(FIXTURE_NODES.map((n) => [n.id, n]))
}

/** Breadth-first neighbourhood of `focus`, up to `hops` edges out. */
function neighbourhood(focus: string, hops: number): Set<string> {
  const adjacency = new Map<string, Set<string>>()
  for (const e of FIXTURE_EDGES) {
    if (!adjacency.has(e.source)) adjacency.set(e.source, new Set())
    if (!adjacency.has(e.target)) adjacency.set(e.target, new Set())
    adjacency.get(e.source)!.add(e.target)
    adjacency.get(e.target)!.add(e.source)
  }
  const seen = new Set<string>([focus])
  let frontier = [focus]
  for (let h = 0; h < hops; h += 1) {
    const next: string[] = []
    for (const id of frontier) {
      for (const nb of adjacency.get(id) ?? []) {
        if (!seen.has(nb)) {
          seen.add(nb)
          next.push(nb)
        }
      }
    }
    frontier = next
  }
  return seen
}

/**
 * Stand-in for `GET /api/graph`. Applies the same filtering / capping a real
 * endpoint should do server-side so the client never has to render everything.
 */
export async function getGraphDataset(
  query: GraphQuery = {}
): Promise<GraphDataset> {
  await delay(LATENCY_MS)

  let nodes = [...FIXTURE_NODES]

  if (typeof query.minRisk === "number") {
    nodes = nodes.filter((n) => n.riskScore >= query.minRisk!)
  }

  if (query.focus) {
    const known = nodeMap().has(query.focus)
    if (!known) {
      return { nodes: [], edges: [], truncated: false }
    }
    const near = neighbourhood(query.focus, query.hops ?? DEFAULT_HOPS)
    nodes = nodes.filter((n) => near.has(n.id))
  }

  nodes.sort((a, b) => b.riskScore - a.riskScore)

  const limit = query.limit ?? DEFAULT_LIMIT
  const truncated = nodes.length > limit
  nodes = nodes.slice(0, limit)

  const ids = new Set(nodes.map((n) => n.id))
  const edges = FIXTURE_EDGES.filter(
    (e) => ids.has(e.source) && ids.has(e.target)
  )

  return { nodes, edges, truncated }
}

function toFlow(counterpartyId: string, edge: TransactionEdge): AddressFlow {
  const node = nodeMap().get(counterpartyId)
  return {
    address: counterpartyId,
    label: node?.label ?? counterpartyId,
    valueBtc: edge.valueBtc,
    txCount: edge.txCount,
    riskScore: node?.riskScore ?? edge.riskScore,
  }
}

const sumBy = <T,>(rows: T[], pick: (row: T) => number) =>
  rows.reduce((total, row) => total + pick(row), 0)

/**
 * Stand-in for `GET /api/addresses/{id}`. Everything returned is either from
 * the existing dashboard data or derived from the graph edges. Fields with no
 * real source stay `null` (rendered as "pending backend", never faked).
 */
export async function getAddressDetail(id: string): Promise<AddressDetail> {
  await delay(LATENCY_MS - 40)

  const node = nodeMap().get(id)
  if (!node) {
    throw new Error(`Address ${id} not found`)
  }

  const incoming = FIXTURE_EDGES.filter((e) => e.target === id).map((e) =>
    toFlow(e.source, e)
  )
  const outgoing = FIXTURE_EDGES.filter((e) => e.source === id).map((e) =>
    toFlow(e.target, e)
  )

  const connectedIds = new Set<string>([
    ...incoming.map((f) => f.address),
    ...outgoing.map((f) => f.address),
  ])
  const connectedAddresses = FIXTURE_NODES.filter((n) => connectedIds.has(n.id))

  const alerts = riskAlerts
    .filter((a) => a.address === id)
    .map((a) => ({ level: a.level, reason: a.reason, score: a.score }))

  const history = activity
    .filter((r) => r.from === id || r.to === id)
    .map((r) => ({
      time: r.time,
      tx: r.tx,
      direction: (r.from === id ? "out" : "in") as "in" | "out",
      counterparty: r.from === id ? r.to : r.from,
      amount: r.amount,
      risk: r.risk,
      status: r.status as string,
    }))

  return {
    id,
    label: node.label,
    riskScore: node.riskScore,
    riskLevel: riskLevel(node.riskScore),
    category: node.category ?? null,
    txCount: sumBy(incoming, (f) => f.txCount) + sumBy(outgoing, (f) => f.txCount),
    incoming,
    outgoing,
    connectedAddresses,
    alerts,
    history,
    // Derived from the current graph window:
    totalReceivedBtc: sumBy(incoming, (f) => f.valueBtc),
    totalSentBtc: sumBy(outgoing, (f) => f.valueBtc),
    // No source yet -> UI shows "pending backend":
    riskFactors: null,
    firstSeen: null,
    lastSeen: null,
  }
}

/** Address ids present in the fixture, for the focus picker. */
export const KNOWN_ADDRESS_IDS = FIXTURE_NODES.map((n) => n.id)
