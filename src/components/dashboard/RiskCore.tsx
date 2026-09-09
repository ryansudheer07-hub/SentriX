import { riskOverview } from "@/lib/dashboardData"
import { MotionNumber } from "@/components/motion/MotionNumber"
import { RiskGauge } from "./RiskGauge"
import { RiskTrend } from "./RiskTrend"

/**
 * Risk Intelligence Core (brief §11) — the operational replacement for the old
 * static gauge. The score stays dominant; around it sit the level, a slim ring,
 * the 24h trajectory, a baseline delta, the factor split and a last-updated
 * stamp. Risk stays on the 0–100 scale with a level word — never "0.87/100".
 */
export function RiskCore() {
  return (
    <section
      className="panel panel--primary risk-core"
      aria-label="Risk intelligence core"
    >
      <div className="risk-core__head">
        <p className="eyebrow eyebrow--gold">Risk Core</p>
        <p className="risk-core__updated">Updated {riskOverview.updated}</p>
      </div>

      <p className="risk-core__band">{riskOverview.band}</p>

      <div className="risk-core__gauge">
        <RiskGauge value={riskOverview.score} size={150} />
        <div className="risk-core__readout">
          <span className="risk-core__score">
            <MotionNumber value={riskOverview.score} animateOnMount />
          </span>
          <span className="risk-core__scale">/ 100</span>
        </div>
      </div>

      <RiskTrend
        values={riskOverview.trend}
        deltaPct={riskOverview.baselineDelta}
      />

      <ul className="risk-core__factors">
        {riskOverview.factors.map((f) => (
          <li key={f.key} className="risk-core__factor">
            <span className="risk-core__factor-label">{f.label}</span>
            <span className="risk-core__factor-bar" aria-hidden="true">
              <span style={{ width: `${f.weight}%` }} />
            </span>
            <span className="risk-core__factor-w">{f.weight}%</span>
          </li>
        ))}
      </ul>

      <p className="risk-core__note">{riskOverview.note}</p>
    </section>
  )
}
