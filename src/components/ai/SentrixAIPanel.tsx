"use client"

import { useEffect, useRef } from "react"

import { useSentrixContext } from "@/lib/ai/context"
import { scrollToSection } from "@/lib/scroll"
import type { AiState } from "@/lib/ai/reducer"
import type { AiAction } from "@/lib/ai/types"
import type { AiMode } from "./useSentrixAI"
import { SentrixAIInput } from "./SentrixAIInput"
import { SentrixAIMessage } from "./SentrixAIMessage"
import { SentrixAISuggestions } from "./SentrixAISuggestions"
import { SentrixAITyping } from "./SentrixAITyping"

interface Props {
  open: boolean
  onClose: () => void
  mode: AiMode
  onCycleMode: () => void
  state: AiState
  canSend: boolean
  onSend: (text: string) => void
  onRetry: () => void
  onClear: () => void
  onAction: (action: AiAction) => void
}

const shortId = (s: string) =>
  s.length > 13 ? `${s.slice(0, 6)}…${s.slice(-4)}` : s

const MODE_GLYPH: Record<AiMode, string> = {
  compact: "⤢",
  expanded: "⇥",
  rail: "⤡",
}
const NEXT_MODE: Record<AiMode, string> = {
  compact: "expand",
  expanded: "dock to rail",
  rail: "shrink",
}

/**
 * The dark-glass command console. Fixed to the viewport, owns its own scroll
 * container (`data-lenis-prevent`), and now runs in three footprints
 * (compact / expanded / investigation rail, §20). A context strip shows exactly
 * what the assistant can currently see (§21).
 */
export function SentrixAIPanel({
  open,
  onClose,
  mode,
  onCycleMode,
  state,
  canSend,
  onSend,
  onRetry,
  onClear,
  onAction,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { context, dispatchCommand } = useSentrixContext()

  useEffect(() => {
    if (!open) return
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [open, state.messages, state.status])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => {
      panelRef.current
        ?.querySelector<HTMLTextAreaElement>(".sai-input__field")
        ?.focus()
    }, 80)
    return () => window.clearTimeout(t)
  }, [open])

  const empty = state.messages.length === 0

  const ctxItems: { label: string; onClick: () => void }[] = [
    {
      label: `Route ${context.route ?? "/"}`,
      onClick: () => scrollToSection("overview"),
    },
  ]
  if (context.graphContext?.nodeCount) {
    ctxItems.push({
      label: `Graph · ${context.graphContext.nodeCount} nodes`,
      onClick: () => scrollToSection("graph-view"),
    })
  }
  if (context.selectedAddress) {
    const addr = context.selectedAddress
    ctxItems.push({
      label: `Selected ${shortId(addr)}`,
      onClick: () => {
        dispatchCommand({ focusAddress: addr, selectId: addr })
        scrollToSection("graph-view")
      },
    })
  }
  if (context.selectedTransaction) {
    ctxItems.push({
      label: `Tx ${shortId(context.selectedTransaction)}`,
      onClick: () => scrollToSection("graph-view"),
    })
  }

  return (
    <div
      ref={panelRef}
      className={
        "sai-panel sai-panel--" + mode + (open ? " sai-panel--open" : "")
      }
      role="dialog"
      aria-label="SentriX AI assistant"
      aria-hidden={!open}
      inert={!open}
    >
      <header className="sai-panel__header">
        <div className="sai-panel__id">
          <div className="sai-panel__titlerow">
            <span className="sai-panel__title">SENTRIX AI</span>
            <span className="sai-panel__online">
              <span className="status-dot status-dot--ok" aria-hidden="true" />
              Online
            </span>
          </div>
          <span className="sai-panel__subtitle">Forensic Intelligence</span>
        </div>
        <div className="sai-panel__tools">
          <button
            type="button"
            className="sai-panel__tool sai-panel__tool--icon"
            onClick={onCycleMode}
            aria-label={`Console size: ${mode}. Click to ${NEXT_MODE[mode]}.`}
            title={`Console: ${mode}`}
          >
            {MODE_GLYPH[mode]}
          </button>
          {!empty && (
            <button type="button" className="sai-panel__tool" onClick={onClear}>
              Clear
            </button>
          )}
          <button
            type="button"
            className="sai-panel__tool sai-panel__tool--icon"
            onClick={onClose}
            aria-label="Close SentriX AI assistant"
          >
            ✕
          </button>
        </div>
      </header>

      <div className="sai-context" aria-label="Assistant context">
        <span className="sai-context__label">Context</span>
        {ctxItems.map((it) => (
          <button
            key={it.label}
            type="button"
            className="sai-context__item"
            onClick={it.onClick}
          >
            {it.label}
          </button>
        ))}
      </div>

      <div ref={scrollRef} className="sai-panel__body" data-lenis-prevent="">
        {empty ? (
          <div className="sai-empty">
            <span className="sai-empty__eyebrow">
              SentriX AI · Forensic Intelligence
            </span>
            <h2 className="sai-empty__title">
              What do you want to investigate?
            </h2>
            <p className="sai-empty__subtitle">
              Ask about an address, a flow, recent alerts or the dashboard — every
              answer runs the real SentriX pipeline.
            </p>
            <SentrixAISuggestions onPick={onSend} disabled={!canSend} />
          </div>
        ) : (
          <ul className="sai-msg-list">
            {state.messages.map((m) => (
              <SentrixAIMessage key={m.id} message={m} onAction={onAction} />
            ))}
            {state.status === "sending" && (
              <li className="sai-msg sai-msg--assistant">
                <SentrixAITyping />
              </li>
            )}
            {state.status === "error" && (
              <li className="sai-error" role="alert">
                <span>{state.error ?? "Something went wrong."}</span>
                <button
                  type="button"
                  className="sai-error__retry"
                  onClick={onRetry}
                >
                  Retry
                </button>
              </li>
            )}
          </ul>
        )}
      </div>

      <SentrixAIInput disabled={!canSend} onSend={onSend} />
    </div>
  )
}
