"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { FloatingPanel } from "@/components/glass/FloatingPanel"
import { requestOpenSentrixAI } from "@/lib/ai/events"
import { filterCommands, wrapIndex, type Command } from "@/lib/commands"
import { scrollToSection } from "@/lib/scroll"
import { SECTIONS } from "@/lib/sections"

/**
 * ⌘K / Ctrl+K command palette (brief §26). Glass-3 overlay on the shared
 * `FloatingPanel`. Keyboard-first: ↑/↓ move, Enter runs, Esc closes. Every
 * command maps to an existing, allow-listed action — scroll to a section,
 * focus the header search, or open the SentriX AI console.
 */
export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [index, setIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const close = useCallback(() => {
    setOpen(false)
    setQuery("")
    setIndex(0)
  }, [])

  const commands = useMemo<Command[]>(() => {
    const list: Command[] = SECTIONS.map((s) => ({
      id: `go-${s.id}`,
      label: `Open ${s.label}`,
      hint: s.n,
      run: () => scrollToSection(s.id),
    }))
    list.push({
      id: "focus-search",
      label: "Search address or transaction",
      hint: "/",
      run: () =>
        document
          .querySelector<HTMLInputElement>(".dash-search__input")
          ?.focus(),
    })
    list.push({
      id: "open-ai",
      label: "Ask SentriX AI",
      hint: "AI",
      run: () => requestOpenSentrixAI(),
    })
    return list
  }, [])

  const results = useMemo(
    () => filterCommands(commands, query),
    [commands, query]
  )
  const active = results.length ? wrapIndex(index, results.length) : 0

  // Global ⌘K / Ctrl+K toggle.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setQuery("")
        setIndex(0)
        setOpen((v) => !v)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // Focus the field + lock page scroll while open.
  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => inputRef.current?.focus(), 40)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.clearTimeout(t)
      document.body.style.overflow = prev
    }
  }, [open])

  const runAt = (i: number) => {
    const cmd = results[i]
    if (!cmd) return
    close()
    cmd.run()
  }

  const onInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setIndex((i) => wrapIndex(i + 1, results.length))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setIndex((i) => wrapIndex(i - 1, results.length))
    } else if (e.key === "Enter") {
      e.preventDefault()
      runAt(active)
    }
  }

  return (
    <div
      className={"cmdk-root" + (open ? " cmdk-root--on" : "")}
      aria-hidden={!open}
    >
      <div className="cmdk-scrim" onClick={close} />
      <FloatingPanel
        open={open}
        onClose={close}
        level={3}
        className="cmdk"
        role="dialog"
        aria-label="Command palette"
        aria-modal
      >
        <input
          ref={inputRef}
          className="cmdk__input"
          type="text"
          placeholder="Type a command…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIndex(0)
          }}
          onKeyDown={onInputKey}
          aria-label="Command palette"
          autoComplete="off"
          spellCheck={false}
        />
        <ul className="cmdk__list" role="listbox" aria-label="Commands">
          {results.map((c, i) => (
            <li key={c.id} role="option" aria-selected={i === active}>
              <button
                type="button"
                className={
                  "cmdk__item" + (i === active ? " cmdk__item--on" : "")
                }
                onMouseMove={() => setIndex(i)}
                onClick={() => runAt(i)}
              >
                <span className="cmdk__label">{c.label}</span>
                {c.hint && <span className="cmdk__hint">{c.hint}</span>}
              </button>
            </li>
          ))}
          {results.length === 0 && (
            <li className="cmdk__empty">No matching commands</li>
          )}
        </ul>
      </FloatingPanel>
    </div>
  )
}
