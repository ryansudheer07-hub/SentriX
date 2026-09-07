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
            {activity.map((row) => (
              <tr key={row.tx}>
                <td className="activity__mono">{row.time}</td>
                <td className="activity__mono">{row.tx}</td>
                <td className="activity__mono activity__amount">{row.amount}</td>
                <td className="activity__mono">{row.from}</td>
                <td className="activity__mono">{row.to}</td>
                <td className={`activity__risk activity__risk--${riskTone(row.risk)}`}>
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
