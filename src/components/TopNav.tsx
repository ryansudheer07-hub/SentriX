import { navItems } from "@/lib/dashboardData"
import { GearIcon, ShieldMark } from "./icons"

export function TopNav() {
  return (
    <header className="topnav">
      <div className="topnav__brand">
        <span className="topnav__badge">
          <ShieldMark size={18} />
        </span>
        <span className="topnav__name">Sentrix</span>
      </div>

      <nav className="topnav__links" aria-label="Primary">
        {navItems.map((item) => (
          <a
            key={item.label}
            href="#"
            className={
              "topnav__link" + (item.active ? " topnav__link--active" : "")
            }
            aria-current={item.active ? "page" : undefined}
          >
            {item.label}
          </a>
        ))}
      </nav>

      <div className="topnav__operator">
        <button type="button" className="topnav__settings" aria-label="Settings">
          <GearIcon size={16} />
        </button>
      </div>
    </header>
  )
}
