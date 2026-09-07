/**
 * Response shapes from the SentriX FastAPI backend (`backend/app/models/schemas.py`).
 * Scores here are 0..1 floats; the frontend works in 0..100 and converts at the
 * mapper boundary (see `graph.ts`, `alerts.ts`).
 */

export interface ApiToken {
  access_token: string
  token_type: string
}

export interface ApiUser {
  username: string
  role: string
  agency: string
}

export interface ApiRiskFactors {
  gnn_score: number
  ppr_score: number
  traffic_anomaly_score: number
  weights: Record<string, number>
}

export interface ApiAddressRisk {
  address: string
  risk_score: number
  contributing_factors: ApiRiskFactors
  last_updated: string
}

export interface ApiAlert {
  id: string
  address: string
  risk_score: number
  reason: string
  flagged_at: string
}

export interface ApiGraphNode {
  id: string
  label: string
  risk_score: number
}

export interface ApiGraphEdge {
  source: string
  target: string
  tx_id: string
  amount: number
}

export interface ApiSubgraphResponse {
  center: string
  depth: number
  nodes: ApiGraphNode[]
  edges: ApiGraphEdge[]
}
