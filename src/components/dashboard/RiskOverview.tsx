import { riskOverview } from "@/lib/dashboardData"
import { RiskGauge } from "./RiskGauge"

export function RiskOverview() {
  return (
    <section className="panel risk-overview">
      <p className="eyebrow eyebrow--gold">Risk Overview</p>

      <div className="risk-overview__gauge">
        <RiskGauge value={riskOverview.score} />
        <div className="risk-overview__readout">
          <span className="risk-overview__score">{riskOverview.score}</span>
          <span className="eyebrow risk-overview__score-label">Risk Score</span>
        </div>
      </div>

      <p className="risk-overview__band">{riskOverview.band}</p>
      <p className="risk-overview__note">{riskOverview.note}</p>
    </section>
  )
}
