"use client"

import { useCallback, useEffect, useState } from "react"

import { scrollToSection } from "@/lib/scroll"
import { SECTIONS } from "@/lib/sections"
import { useAuth } from "@/components/auth/AuthProvider"
import { Portal } from "@/components/glass/Portal"

/**
 * Responsive navigation for tablet and phone (brief §25). The desktop top-nav
 * links stay as they are; ≤1024px they give way to this hamburger, which opens
 * a full-height glass drawer with the real dashboard sections, the operator
 * identity and Sign out. Nothing about auth changes — it just calls
 * `useAuth().logout`.
 */
export function MobileNav() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)

  const close = useCallback(() => setOpen(false), [])

  // Lock the page behind the drawer + close on Escape while it is open.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
  }, [open, close])

  const go = (id: string) => {
    close()
    scrollToSection(id)
  }

  return (
    <>
      <button
        type="button"
        className="mobile-nav__toggle"
        aria-label="Open navigation"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path
            d="M2 4h14M2 9h14M2 14h14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <Portal>
        <div
          className={
            "mobile-nav__scrim" + (open ? " mobile-nav__scrim--on" : "")
          }
          onClick={close}
          aria-hidden="true"
        />

        <nav
          className={
            "mobile-nav__drawer" + (open ? " mobile-nav__drawer--on" : "")
          }
          aria-label="Navigation"
          aria-hidden={!open}
          inert={!open}
        >
        <div className="mobile-nav__head">
          <span className="mobile-nav__brand">SENTRIX</span>
          <button
            type="button"
            className="mobile-nav__close"
            aria-label="Close navigation"
            onClick={close}
          >
            ✕
          </button>
        </div>

        <ul className="mobile-nav__list">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                className="mobile-nav__item"
                onClick={() => go(s.id)}
              >
                <span className="mobile-nav__n">{s.n}</span>
                {s.label}
              </button>
            </li>
          ))}
        </ul>

        {user && (
          <div className="mobile-nav__operator">
            <span className="mobile-nav__user">
              {user.username}
              <span className="mobile-nav__user-sep"> · </span>
              <span className="mobile-nav__user-role">{user.role}</span>
            </span>
            <button
              type="button"
              className="mobile-nav__signout"
              onClick={() => {
                close()
                logout()
              }}
            >
              Sign out
            </button>
          </div>
        )}
        </nav>
      </Portal>
    </>
  )
}
