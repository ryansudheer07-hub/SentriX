"use client"

import { useEffect, useState } from "react"

import { useSentrixContext } from "@/lib/ai/context"
import { fetchRiskAlerts } from "@/lib/api/alerts"
import { scrollToSection } from "@/lib/scroll"
import type { AlertLevel, RiskAlert } from "@/lib/dashboardData"

const toneByLevel: Record<AlertLevel, string> = {
  CRITICAL: "danger",
  HIGH: "warn",
  MEDIUM: "muted",
}

type Status = "loading" | "loaded" | "error"

/**
 * Recent risk alerts (live, `GET /alerts`). Each row is an expandable
 * intelligence event (brief §18): open it for the full reason, the score on the
 * 0–100 scale, and a jump straight into the graph focused on that address.
 */
export function RiskAlerts() {
  const [alerts, setAlerts] = useState<RiskAlert[]>([])
  const [status, setStatus] = useState<Status>("loading")
  const [retry, setRetry] = useState(0)
  const [openAddr, setOpenAddr] = useState<string | null>(null)

  const { dispatchCommand } = useSentrixContext()

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

  const investigate = (address: string) => {
    dispatchCommand({ focusAddress: address, selectId: address })
    scrollToSection("graph-view")
  }

  return (
    <section className="panel risk-alerts">
      <p className="eyebrow eyebrow--gold">Recent Risk Alerts</p>

      {status === "loading" && <p className="risk-alerts__msg">Loading alerts…</p>}

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
          {alerts.map((alert, i) => {
            const open = openAddr === alert.address
            const rid = `alert-panel-${i}`
            return (
              <li
                key={alert.address}
                className={`risk-alerts__event risk-alerts__event--${toneByLevel[alert.level]}`}
              >
                <button
                  type="button"
                  className="risk-alerts__toggle"
                  aria-expanded={open}
                  aria-controls={rid}
                  onClick={() => setOpenAddr(open ? null : alert.address)}
                >
                  <span className="risk-alerts__level">{alert.level}</span>
                  <span className="risk-alerts__addr">{alert.address}</span>
                  <span className="risk-alerts__score">{alert.score}/100</span>
                  <span className="risk-alerts__chev" aria-hidden="true">
                    {open ? "▾" : "▸"}
                  </span>
                </button>

                <div
                  id={rid}
                  className="risk-alerts__detail"
                  role="region"
                  aria-label={`Alert detail for ${alert.address}`}
                  hidden={!open}
                >
                  <p className="risk-alerts__reason">{alert.reason}</p>
                  <dl className="risk-alerts__kv">
                    <div>
                      <dt>Level</dt>
                      <dd>{alert.level}</dd>
                    </div>
                    <div>
                      <dt>Risk score</dt>
                      <dd>{alert.score}/100</dd>
                    </div>
                    <div>
                      <dt>Address</dt>
                      <dd className="risk-alerts__mono">{alert.address}</dd>
                    </div>
                  </dl>
                  <button
                    type="button"
                    className="btn btn--gold"
                    onClick={() => investigate(alert.address)}
                  >
                    Investigate in graph
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
