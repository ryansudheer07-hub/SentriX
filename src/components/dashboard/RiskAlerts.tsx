"use client"

import { useEffect, useState } from "react"

import { fetchRiskAlerts } from "@/lib/api/alerts"
import type { AlertLevel, RiskAlert } from "@/lib/dashboardData"

const toneByLevel: Record<AlertLevel, string> = {
  CRITICAL: "danger",
  HIGH: "warn",
  MEDIUM: "muted",
}

type Status = "loading" | "loaded" | "error"

export function RiskAlerts() {
  const [alerts, setAlerts] = useState<RiskAlert[]>([])
  const [status, setStatus] = useState<Status>("loading")
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      await Promise.resolve()
      if (cancelled) return
      setStatus("loading")
      try {
        const rows = await fetchRiskAlerts(6)
        if (cancelled) return
        setAlerts(rows)
        setStatus("loaded")
      } catch {
        if (cancelled) return
        setStatus("error")
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [retry])

  return (
    <section className="panel risk-alerts">
      <p className="eyebrow eyebrow--gold">Recent Risk Alerts</p>

      {status === "loading" && (
        <p className="risk-alerts__msg">Loading alerts…</p>
      )}

      {status === "error" && (
        <p className="risk-alerts__msg">
          Couldn&rsquo;t load alerts.{" "}
          <button
            type="button"
            className="risk-alerts__retry"
            onClick={() => setRetry((n) => n + 1)}
          >
            Retry
          </button>
        </p>
      )}

      {status === "loaded" && alerts.length === 0 && (
        <p className="risk-alerts__msg">No addresses above the alert threshold.</p>
      )}

      {status === "loaded" && alerts.length > 0 && (
        <ul className="risk-alerts__list">
          {alerts.map((alert) => (
            <li
              key={alert.address}
              className={`risk-alerts__row risk-alerts__row--${toneByLevel[alert.level]}`}
            >
              <span className="risk-alerts__level">{alert.level}</span>
              <span className="risk-alerts__sep">·</span>
              <span className="risk-alerts__addr">{alert.address}</span>
              <span className="risk-alerts__sep">·</span>
              <span className="risk-alerts__reason">{alert.reason}</span>
              <span className="risk-alerts__sep">·</span>
              <span className="risk-alerts__score">SCORE {alert.score}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
