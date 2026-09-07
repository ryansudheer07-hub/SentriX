import { stats } from "@/lib/dashboardData"

export function StatGrid() {
  return (
    <div className="stat-grid">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={
            "stat-cell" + (stat.tone === "danger" ? " stat-cell--danger" : "")
          }
        >
          <p className="stat-cell__value">{stat.value}</p>
          <p className="eyebrow stat-cell__label">{stat.label}</p>
          <p
            className={
              "stat-cell__delta" +
              (stat.tone === "danger" ? " stat-cell__delta--danger" : "")
            }
          >
            {stat.delta}
          </p>
        </div>
      ))}
    </div>
  )
}
