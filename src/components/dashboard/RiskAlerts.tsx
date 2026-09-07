import { riskAlerts, type AlertLevel } from "@/lib/dashboardData"

const toneByLevel: Record<AlertLevel, string> = {
  CRITICAL: "danger",
  HIGH: "warn",
  MEDIUM: "muted",
}

export function RiskAlerts() {
  return (
    <section className="panel risk-alerts">
      <p className="eyebrow eyebrow--gold">Recent Risk Alerts</p>

      <ul className="risk-alerts__list">
        {riskAlerts.map((alert) => (
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
    </section>
  )
}
