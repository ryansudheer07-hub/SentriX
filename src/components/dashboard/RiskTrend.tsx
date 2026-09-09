import { IntelligenceChart } from "@/components/charts/IntelligenceChart"

type RiskTrendProps = {
  /** 0–100, oldest → newest. */
  values: number[]
  /** % vs baseline; positive = risk rising. */
  deltaPct?: number
}

/**
 * The Risk Core's 24h trajectory (brief §11) — now an interactive
 * `IntelligenceChart` (hover / arrow-key inspect, gliding tooltip) plus the
 * baseline delta. Falls back cleanly when there is no series.
 */
export function RiskTrend({ values, deltaPct }: RiskTrendProps) {
  const rising = (deltaPct ?? 0) >= 0

  return (
    <div className="risk-trend">
      <IntelligenceChart
        values={values}
        label="Risk"
        className="risk-trend__chart"
      />
      <div className="risk-trend__meta">
        <span className="risk-trend__label">Risk trajectory</span>
        {deltaPct != null && (
          <span
            className={
              "risk-trend__delta " +
              (rising ? "risk-trend__delta--up" : "risk-trend__delta--down")
            }
          >
            {rising ? "+" : ""}
            {deltaPct}% vs baseline
          </span>
        )}
      </div>
    </div>
  )
}
