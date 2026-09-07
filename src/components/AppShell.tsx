import { BinaryField } from "./BinaryField"
import { SiteIntro } from "./SiteIntro"
import { TopNav } from "./TopNav"
import { DashboardHeader } from "./dashboard/DashboardHeader"
import { Explainability } from "./dashboard/Explainability"
import { LiveActivityTable } from "./dashboard/LiveActivityTable"
import { RiskAlerts } from "./dashboard/RiskAlerts"
import { RiskOverview } from "./dashboard/RiskOverview"
import { StatGrid } from "./dashboard/StatGrid"
import { TransactionGraph } from "./dashboard/TransactionGraph"
import { GraphView } from "./graph/GraphView"

/**
 * Full Sentrix command center: the boot-sequence intro, fixed nav, then one
 * dashboard card that holds every panel. Content is static (see
 * `@/lib/dashboardData`) pending a real backend.
 */
export function AppShell() {
  return (
    <>
      <BinaryField variant="ambient" />
      <SiteIntro />
      <TopNav />
      <main className="page">
        <div className="dashboard">
          <DashboardHeader />
          <StatGrid />

          <div className="dashboard__row dashboard__row--split">
            <RiskOverview />
            <TransactionGraph />
          </div>

          <div className="dashboard__row dashboard__row--pair">
            <RiskAlerts />
            <Explainability />
          </div>

          <LiveActivityTable />
          <GraphView />
        </div>
      </main>
    </>
  )
}
