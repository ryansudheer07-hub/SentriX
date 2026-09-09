/**
 * The dashboard's real navigable sections — the scroll anchors already set on
 * the `<Reveal id>` wrappers and on `<section id="graph-view">`. The section
 * rail, the mobile nav drawer and the command palette all read this list so the
 * numbering and labels never drift apart.
 */
export interface DashboardSection {
  /** DOM id of the anchor. */
  id: string
  /** Two-digit index shown in the rail. */
  n: string
  label: string
}

export const SECTIONS: readonly DashboardSection[] = [
  { id: "overview", n: "01", label: "Overview" },
  { id: "risk-overview", n: "02", label: "Risk" },
  { id: "alerts", n: "03", label: "Alerts" },
  { id: "activity", n: "04", label: "Activity" },
  { id: "graph-view", n: "05", label: "Network" },
  { id: "transaction-analysis", n: "06", label: "Analysis" },
] as const
