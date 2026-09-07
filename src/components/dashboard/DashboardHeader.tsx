import { searchPlaceholder } from "@/lib/dashboardData"
import { SearchIcon } from "../icons"

export function DashboardHeader() {
  return (
    <div className="dash-header">
      <div className="dash-header__titles">
        <p className="eyebrow eyebrow--gold">Sentrix Intelligence</p>
        <h2 className="dash-header__title">
          Bitcoin Network Forensics &amp; Risk Intelligence
        </h2>
        <p className="dash-header__status">
          <span className="status-dot status-dot--ok" aria-hidden="true" />
          Live Monitoring
        </p>
      </div>

      <div className="dash-search" role="search">
        <SearchIcon size={15} className="dash-search__icon" />
        <input
          className="dash-search__input"
          type="text"
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
        />
        <button type="button" className="btn btn--gold">
          Investigate
        </button>
      </div>
    </div>
  )
}
