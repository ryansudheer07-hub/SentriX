import type { AlertLevel, RiskAlert } from "@/lib/dashboardData"
import { apiFetch } from "./client"
import type { ApiAlert } from "./types"

function toLevel(score100: number): AlertLevel {
  if (score100 >= 90) return "CRITICAL"
  if (score100 >= 80) return "HIGH"
  return "MEDIUM"
}

function toRiskAlert(a: ApiAlert): RiskAlert {
  const score = Math.round(a.risk_score * 100)
  return {
    level: toLevel(score),
    address: a.address,
    reason: a.reason,
    score,
  }
}

/** `GET /alerts` -> the dashboard's existing `RiskAlert` shape (0-100 scores). */
export async function fetchRiskAlerts(limit = 6): Promise<RiskAlert[]> {
  const alerts = await apiFetch<ApiAlert[]>(
    `/alerts?threshold=0.8&limit=${limit}`
  )
  return alerts.map(toRiskAlert)
}
