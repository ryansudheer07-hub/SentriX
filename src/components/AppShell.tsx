import { BinaryField } from "./BinaryField"
import { SiteIntro } from "./SiteIntro"
import { TopNav } from "./TopNav"
import { AuthGate } from "./auth/AuthGate"
import { DashboardHeader } from "./dashboard/DashboardHeader"
import { Explainability } from "./dashboard/Explainability"
import { LiveActivityTable } from "./dashboard/LiveActivityTable"
import { RiskAlerts } from "./dashboard/RiskAlerts"
import { RiskOverview } from "./dashboard/RiskOverview"
import { StatGrid } from "./dashboard/StatGrid"
import { TransactionGraph } from "./dashboard/TransactionGraph"
import { GraphView } from "./graph/GraphView"

/**
 * Full Sentrix command center: the boot intro and ambient field render for
 * everyone; the nav + dashboard are behind the auth gate (the backend requires
 * a session for all data). Risk Alerts + the Graph View are wired to the API;
 * the remaining panels still render `@/lib/dashboardData` fixtures.
 */
export function AppShell() {
  return (
    <>
      <BinaryField variant="ambient" />
      <SiteIntro />
      <AuthGate>
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
      </AuthGate>
    </>
  )
}
