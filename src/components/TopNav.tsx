"use client"

import { useEffect, useState } from "react"

import { navItems } from "@/lib/dashboardData"
import { useAuth } from "./auth/AuthProvider"
import { GearIcon, ShieldMark } from "./icons"
import { MobileNav } from "./navigation/MobileNav"

export function TopNav() {
  const { user, logout } = useAuth()
  const [scrolled, setScrolled] = useState(false)

  // Gold-tinted hairline once the operator has scrolled off the top.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header className="topnav" data-scrolled={scrolled || undefined}>
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
        {user && (
          <span className="topnav__user">
            <span className="topnav__user-name">{user.username}</span>
            <span className="topnav__user-sep">·</span>
            <span className="topnav__user-role">{user.role}</span>
          </span>
        )}
        {user && (
          <button
            type="button"
            className="topnav__logout"
            onClick={logout}
          >
            Sign out
          </button>
        )}
        <button type="button" className="topnav__settings" aria-label="Settings">
          <GearIcon size={16} />
        </button>
        <MobileNav />
      </div>
    </header>
  )
}
