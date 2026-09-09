"use client"

import { Fragment, type ReactNode } from "react"

import { isAllowedAction } from "@/lib/ai/actions"
import type { AiAction, ChatMessage } from "@/lib/ai/types"

interface Props {
  message: ChatMessage
  onAction: (action: AiAction) => void
}

const timeFmt = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
})

/** Inline `**bold**` only — no HTML, no arbitrary markdown. */
function renderInline(text: string, key: string): ReactNode[] {
  const parts: ReactNode[] = []
  const re = /\*\*(.+?)\*\*/g
  let last = 0
  let i = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    parts.push(<strong key={`${key}-b${i++}`}>{m[1]}</strong>)
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

function renderBody(text: string): ReactNode {
  const blocks = text.split(/\n{2,}/)
  return blocks.map((block, bi) => {
    const trimmed = block.trim()
    if (/^evidence\b/i.test(trimmed)) {
      return (
        <pre key={`e${bi}`} className="sai-msg__evidence">
          {trimmed}
        </pre>
      )
    }
    const lines = block.split("\n")
    return (
      <p key={`p${bi}`} className="sai-msg__p">
        {lines.map((line, li) => (
          <Fragment key={`p${bi}-l${li}`}>
            {li > 0 && <br />}
            {renderInline(line, `p${bi}-l${li}`)}
          </Fragment>
        ))}
      </p>
    )
  })
}

function actionLabel(action: AiAction): string {
  const t = action.target ?? ""
  switch (action.type) {
    case "navigate":
      return `Go to ${t.replace(/-/g, " ")}`
    case "open_address":
      return `Open ${short(t)}`
    case "focus_graph_node":
      return `Focus ${short(t)} in graph`
    case "open_transaction":
      return `Open transaction ${short(t)}`
    case "open_alert":
      return "Open alert"
    case "filter_risk":
      return `Filter graph: ${String(action.payload?.level ?? "all")} risk`
    default:
      return "Run action"
  }
}

const short = (s: string) => (s.length > 14 ? `${s.slice(0, 6)}…${s.slice(-4)}` : s)

export function SentrixAIMessage({ message, onAction }: Props) {
  const mine = message.role === "user"
  const actions = (message.actions ?? []).filter(isAllowedAction)
  const sources = message.sources ?? []

  return (
    <li
      className={
        "sai-msg " + (mine ? "sai-msg--user" : "sai-msg--assistant")
      }
    >
      <div
        className={
          "sai-msg__bubble" +
          (message.error ? " sai-msg__bubble--error" : "")
        }
      >
        {renderBody(message.text)}
      </div>

      {sources.length > 0 && (
        <div className="sai-msg__sources" aria-label="Evidence sources">
          {sources.map((s, i) => (
            <span
              key={`${s.type}-${s.id}-${i}`}
              className="sai-source-chip"
              title={s.type}
            >
              {s.label || s.id}
            </span>
          ))}
        </div>
      )}

      {actions.length > 0 && (
        <div className="sai-msg__actions">
          {actions.map((a, i) => (
            <button
              key={`${a.type}-${i}`}
              type="button"
              className="sai-action-btn"
              onClick={() => onAction(a)}
            >
              {actionLabel(a)}
            </button>
          ))}
        </div>
      )}

      <time className="sai-msg__time" dateTime={new Date(message.at).toISOString()}>
        {timeFmt.format(message.at)}
      </time>
    </li>
  )
}
