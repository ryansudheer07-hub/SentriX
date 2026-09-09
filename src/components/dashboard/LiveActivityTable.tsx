import type { CSSProperties } from "react"

import {
  activity,
  suggestedQueries,
  type ActivityStatus,
} from "@/lib/dashboardData"

const statusTone: Record<ActivityStatus, string> = {
  FLAGGED: "danger",
  REVIEW: "warn",
  CLEARED: "ok",
}

function riskTone(risk: number): string {
  if (risk >= 90) return "danger"
  if (risk >= 50) return "warn"
  return "ok"
}

const COLUMNS = ["Time", "Transaction", "Amount", "From", "To", "Risk", "Status"]

/** CSS custom properties don't fit `CSSProperties` in this TS lib version. */
const cssVars = (v: Record<string, number>): CSSProperties =>
  v as unknown as CSSProperties

/**
 * Live transaction stream (brief §17). Fixture-backed for now — a real feed
 * replaces `activity`. Each row carries a risk micro-bar and lifts on hover;
 * rows ease in on mount (staggered, reduced-motion-safe via CSS).
 */
export function LiveActivityTable() {
  return (
    <section className="panel activity">
      <div className="activity__head">
        <p className="eyebrow eyebrow--gold">Live Transaction Activity</p>
        <p className="eyebrow activity__pulse">
          <span className="status-dot status-dot--ok" aria-hidden="true" />
          Refreshing in Real Time
        </p>
      </div>

      <div className="activity__scroll">
        <table className="activity__table">
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th key={col} className="eyebrow">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activity.map((row, i) => (
              <tr
                key={row.tx}
                className="activity__row"
                style={cssVars({ "--row-i": i })}
              >
                <td className="activity__mono">{row.time}</td>
                <td className="activity__mono">{row.tx}</td>
                <td className="activity__mono activity__amount">{row.amount}</td>
                <td className="activity__mono">{row.from}</td>
                <td className="activity__mono">{row.to}</td>
                <td className={`activity__risk activity__risk--${riskTone(row.risk)}`}>
                  <span
                    className="activity__riskbar"
                    aria-hidden="true"
                    style={cssVars({ "--risk": row.risk })}
                  >
                    <span />
                  </span>
                  {row.risk}
                </td>
                <td>
                  <span className={`pill pill--${statusTone[row.status]}`}>
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="activity__suggested">
        <span className="activity__suggested-label">Try:</span>
        {suggestedQueries.map((q, i) => (
          <span key={q}>
            <span className="activity__query">&ldquo;{q}&rdquo;</span>
            {i < suggestedQueries.length - 1 && (
              <span className="activity__suggested-sep">·</span>
            )}
          </span>
        ))}
      </p>
    </section>
  )
}
