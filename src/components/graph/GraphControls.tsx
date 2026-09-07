"use client"

import { useId, useState } from "react"

import { KNOWN_ADDRESS_IDS } from "@/lib/graphData"
import { RISK_LEVEL_VAR, type RiskLevel } from "@/lib/graphTypes"
import { MinusIcon, PlusIcon } from "../icons"
import type { GraphControlsApi } from "./GraphCanvas"

type GraphControlsProps = {
  minRisk: number
  onMinRiskChange: (value: number) => void
  focus: string
  onFocusChange: (value: string) => void
  limit: number
  onLimitChange: (value: number) => void
  controls: GraphControlsApi | null
  truncated: boolean
}

const RISK_OPTIONS: { label: string; value: number }[] = [
  { label: "All", value: 0 },
  { label: "Med+", value: 50 },
  { label: "High", value: 80 },
]

const LIMIT_OPTIONS = [10, 25, 50]

const LEGEND: { level: RiskLevel; label: string }[] = [
  { level: "high", label: "High" },
  { level: "medium", label: "Medium" },
  { level: "low", label: "Low" },
]

export function GraphControls({
  minRisk,
  onMinRiskChange,
  focus,
  onFocusChange,
  limit,
  onLimitChange,
  controls,
  truncated,
}: GraphControlsProps) {
  const listId = useId()

  // Local draft so typing doesn't refetch on every keystroke. Re-sync when the
  // committed `focus` changes from outside (e.g. "Clear filters") -- the
  // previous-value-in-render pattern, not an effect.
  const [draftFocus, setDraftFocus] = useState(focus)
  const [committedFocus, setCommittedFocus] = useState(focus)
  if (focus !== committedFocus) {
    setCommittedFocus(focus)
    setDraftFocus(focus)
  }

  const commitFocus = () => {
    const next = draftFocus.trim()
    if (next !== focus) onFocusChange(next)
  }

  return (
    <div className="graph-controls">
      <div className="graph-controls__group">
        <span className="eyebrow graph-controls__label">Risk</span>
        <div className="graph-controls__segment" role="group" aria-label="Minimum risk">
          {RISK_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={
                "graph-controls__seg-btn" +
                (minRisk === opt.value ? " graph-controls__seg-btn--on" : "")
              }
              aria-pressed={minRisk === opt.value}
              onClick={() => onMinRiskChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="graph-controls__group">
        <span className="eyebrow graph-controls__label">Focus</span>
        <input
          className="graph-controls__input"
          type="text"
          list={listId}
          placeholder="Address · blank = overview"
          value={draftFocus}
          onChange={(e) => setDraftFocus(e.target.value)}
          onBlur={commitFocus}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              commitFocus()
            }
          }}
          aria-label="Focus address"
        />
        <datalist id={listId}>
          {KNOWN_ADDRESS_IDS.map((id) => (
            <option key={id} value={id} />
          ))}
        </datalist>
      </div>

      <div className="graph-controls__group">
        <span className="eyebrow graph-controls__label">Max nodes</span>
        <select
          className="graph-controls__select"
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          aria-label="Maximum nodes"
        >
          {LIMIT_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      <div className="graph-controls__group graph-controls__group--push">
        <button
          type="button"
          className="graph-controls__icon-btn"
          aria-label="Zoom out"
          disabled={!controls}
          onClick={() => controls?.zoomOut()}
        >
          <MinusIcon size={13} />
        </button>
        <button
          type="button"
          className="graph-controls__icon-btn"
          aria-label="Zoom in"
          disabled={!controls}
          onClick={() => controls?.zoomIn()}
        >
          <PlusIcon size={13} />
        </button>
        <button
          type="button"
          className="graph-controls__text-btn"
          disabled={!controls}
          onClick={() => controls?.fit()}
        >
          Fit
        </button>
        <button
          type="button"
          className="graph-controls__text-btn"
          disabled={!controls}
          onClick={() => controls?.reset()}
        >
          Reset
        </button>
      </div>

      <div className="graph-controls__legend" aria-hidden="true">
        {LEGEND.map((item) => (
          <span key={item.level} className="graph-controls__legend-item">
            <span
              className="graph-controls__swatch"
              style={{ background: `var(${RISK_LEVEL_VAR[item.level]})` }}
            />
            {item.label}
          </span>
        ))}
        {truncated && (
          <span className="graph-controls__truncated">
            Showing top {limit} — refine filters
          </span>
        )}
      </div>
    </div>
  )
}
