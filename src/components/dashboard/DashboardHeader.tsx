import { WorkstationHeader } from "../workstation/WorkstationHeader"
import { DashboardSearch } from "./DashboardSearch"

/**
 * The dashboard's operational header — the forensic status strip, a two-tone
 * display title and the global search / investigate field (kept as
 * `.dash-search__input` because the command palette focuses it).
 */
export function DashboardHeader() {
  return (
    <div className="dash-hero">
      <WorkstationHeader
        hud
        hudRight="System Online · Network: Bitcoin"
        eyebrow="Sentrix Intelligence"
        eyebrowTail="Live Monitoring"
        titleLead="Bitcoin"
        titleAccent="network forensics"
        titleAs="h1"
        description="Real-time Bitcoin risk intelligence — address scoring, transaction-graph analysis and traffic correlation across the monitored set."
      />
      <DashboardSearch />
    </div>
  )
}
