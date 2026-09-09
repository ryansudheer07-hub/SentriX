/**
 * Graph View data, backed by the SentriX API.
 *
 *   getGraphDataset(query)  ->  GET /graph/{center}?depth=      (SubgraphResponse)
 *   getAddressDetail(id)    ->  GET /address/{id}/risk  +  GET /graph/{id}?depth=1
 *
 * Same signatures as the offline fixture in `@/lib/graphData` so the Graph View
 * components are unchanged. Backend scores are 0..1 and are scaled to 0..100
 * here. The `riskFactors` breakdown is now real (GNN / PPR / traffic anomaly).
 */

import {
  riskLevel,
  type AddressDetail,
  type AddressFlow,
  type GraphDataset,
  type GraphQuery,
} from "@/lib/graphTypes"
import { apiFetch } from "./client"
import type { ApiAlert, ApiAddressRisk, ApiSubgraphResponse } from "./types"

const DEFAULT_LIMIT = 25
const FALLBACK_CENTER = "1SentrixOverview"

const to100 = (score01: number) => Math.round(score01 * 100)
const clampDepth = (hops?: number) => Math.min(3, Math.max(1, hops ?? 1))

async function resolveCenter(query: GraphQuery): Promise<string> {
  if (query.focus) return query.focus
  try {
    const alerts = await apiFetch<ApiAlert[]>("/alerts?threshold=0.8&limit=1")
    if (alerts[0]) return alerts[0].address
  } catch {
    /* fall through to the constant seed */
  }
  return FALLBACK_CENTER
}

export async function getGraphDataset(
  query: GraphQuery = {}
): Promise<GraphDataset> {
  const center = await resolveCenter(query)
  const sub = await apiFetch<ApiSubgraphResponse>(
    `/graph/${encodeURIComponent(center)}?depth=${clampDepth(query.hops)}`
  )

  let nodes = sub.nodes.map((n) => ({
    id: n.id,
    label: n.label,
    riskScore: to100(n.risk_score),
  }))

  if (typeof query.minRisk === "number") {
    nodes = nodes.filter((n) => n.riskScore >= query.minRisk!)
  }
  nodes.sort((a, b) => b.riskScore - a.riskScore)

  const limit = query.limit ?? DEFAULT_LIMIT
  const truncated = nodes.length > limit
  nodes = nodes.slice(0, limit)

  const kept = new Set(nodes.map((n) => n.id))
  const scoreOf = new Map(nodes.map((n) => [n.id, n.riskScore]))
  const edges = sub.edges
    .filter((e) => kept.has(e.source) && kept.has(e.target))
    .map((e) => ({
      id: e.tx_id,
      source: e.source,
      target: e.target,
      valueBtc: e.amount,
      txCount: 1,
      riskScore: Math.max(scoreOf.get(e.source) ?? 0, scoreOf.get(e.target) ?? 0),
    }))

  return { nodes, edges, truncated }
}

const sumBy = <T,>(rows: T[], pick: (r: T) => number) =>
  rows.reduce((total, r) => total + pick(r), 0)

export async function getAddressDetail(id: string): Promise<AddressDetail> {
  const [risk, sub, alertPool] = await Promise.all([
    apiFetch<ApiAddressRisk>(`/address/${encodeURIComponent(id)}/risk`),
    apiFetch<ApiSubgraphResponse>(
      `/graph/${encodeURIComponent(id)}?depth=1`
    ),
    apiFetch<ApiAlert[]>("/alerts?threshold=0.7&limit=100").catch(
      () => [] as ApiAlert[]
    ),
  ])

  const scoreOf = new Map(sub.nodes.map((n) => [n.id, to100(n.risk_score)]))
  const labelOf = new Map(sub.nodes.map((n) => [n.id, n.label]))

  const flow = (counterparty: string, amount: number): AddressFlow => ({
    address: counterparty,
    label: labelOf.get(counterparty) ?? counterparty,
    valueBtc: amount,
    txCount: 1,
    riskScore: scoreOf.get(counterparty) ?? 0,
  })

  const incoming = sub.edges
    .filter((e) => e.target === id)
    .map((e) => flow(e.source, e.amount))
  const outgoing = sub.edges
    .filter((e) => e.source === id)
    .map((e) => flow(e.target, e.amount))

  const connectedIds = new Set<string>([
    ...incoming.map((f) => f.address),
    ...outgoing.map((f) => f.address),
  ])
  const connectedAddresses = sub.nodes
    .filter((n) => connectedIds.has(n.id))
    .map((n) => ({ id: n.id, label: n.label, riskScore: to100(n.risk_score) }))

  const score = to100(risk.risk_score)
  const f = risk.contributing_factors

  return {
    id,
    label: id,
    riskScore: score,
    riskLevel: riskLevel(score),
    category: null,
    txCount: sub.edges.filter((e) => e.source === id || e.target === id).length,
    incoming,
    outgoing,
    connectedAddresses,
    alerts: alertPool
      .filter((a) => a.address === id)
      .map((a) => ({
        level: a.risk_score >= 0.9 ? "CRITICAL" : "HIGH",
        reason: a.reason,
        score: to100(a.risk_score),
      })),
    history: [],
    riskFactors: [
      { label: "GNN score", weight: to100(f.gnn_score) },
      { label: "Personalized PageRank", weight: to100(f.ppr_score) },
      { label: "Traffic anomaly", weight: to100(f.traffic_anomaly_score) },
    ],
    firstSeen: null,
    lastSeen: risk.last_updated,
    totalReceivedBtc: sumBy(incoming, (r) => r.valueBtc),
    totalSentBtc: sumBy(outgoing, (r) => r.valueBtc),
  }
}
