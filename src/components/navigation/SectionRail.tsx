"use client"

import { useEffect, useRef, useState } from "react"

import { scrollToSection } from "@/lib/scroll"
import { SECTIONS } from "@/lib/sections"

/**
 * A quiet left-side chapter index (brief §28). Desktop only — the mobile nav
 * drawer covers the same need on smaller screens (hidden via CSS ≤1024px).
 * The active section is tracked with one IntersectionObserver; a gold line
 * marks it. Clicking a row glides to that anchor.
 */
export function SectionRail() {
  const [active, setActive] = useState(SECTIONS[0].id)
  const visible = useRef<Set<string>>(new Set())

  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => el != null
    )
    if (els.length === 0) return

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.current.add(e.target.id)
          else visible.current.delete(e.target.id)
        }
        const next = SECTIONS.find((s) => visible.current.has(s.id))
        if (next) setActive(next.id)
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <nav className="section-rail" aria-label="Dashboard sections">
      <ul className="section-rail__list">
        {SECTIONS.map((s) => {
          const on = s.id === active
          return (
            <li key={s.id}>
              <button
                type="button"
                className={
                  "section-rail__item" +
                  (on ? " section-rail__item--on" : "")
                }
                aria-current={on ? "true" : undefined}
                onClick={() => scrollToSection(s.id)}
              >
                <span className="section-rail__n">{s.n}</span>
                <span className="section-rail__label">{s.label}</span>
                <span className="section-rail__mark" aria-hidden="true" />
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
