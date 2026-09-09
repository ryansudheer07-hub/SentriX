import { SentrixContextProvider } from "@/lib/ai/context"
import { BinaryField } from "./BinaryField"
import { Reveal } from "./Reveal"
import { SiteIntro } from "./SiteIntro"
import { TopNav } from "./TopNav"
import { SentrixAIMount } from "./ai/SentrixAIMount"
import { CommandPalette } from "./navigation/CommandPalette"
import { SectionRail } from "./navigation/SectionRail"
import { AuthGate } from "./auth/AuthGate"
import { DashboardHeader } from "./dashboard/DashboardHeader"
import { Explainability } from "./dashboard/Explainability"
import { LiveActivityTable } from "./dashboard/LiveActivityTable"
import { RiskAlerts } from "./dashboard/RiskAlerts"
import { RiskCore } from "./dashboard/RiskCore"
import { StatGrid } from "./dashboard/StatGrid"
import { TransactionAnalysis } from "./dashboard/TransactionAnalysis"
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
        <SentrixContextProvider>
          <TopNav />
          <SectionRail />
          <CommandPalette />
          <main className="page">
            <div className="dashboard">
              <Reveal id="overview">
                <DashboardHeader />
              </Reveal>
              <Reveal delay={60}>
                <StatGrid />
              </Reveal>

              <Reveal delay={120} id="risk-overview">
                <div className="dashboard__row dashboard__row--split">
                  <RiskCore />
                  <TransactionGraph />
                </div>
              </Reveal>

              <Reveal id="alerts">
                <div className="dashboard__row dashboard__row--pair">
                  <RiskAlerts />
                  <Explainability />
                </div>
              </Reveal>

              <Reveal id="activity">
                <LiveActivityTable />
              </Reveal>
              <Reveal>
                <GraphView />
              </Reveal>
              <Reveal>
                <TransactionAnalysis />
              </Reveal>
            </div>
          </main>
          <SentrixAIMount />
        </SentrixContextProvider>
      </AuthGate>
    </>
  )
}
