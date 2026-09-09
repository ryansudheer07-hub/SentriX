"use client"

/**
 * Empty-state prompts. Each one is a normal message send — it runs the real
 * pipeline (context + tools), there are no canned answers behind them.
 */
export const SENTRIX_AI_SUGGESTIONS = [
  "Explain this address",
  "Show high-risk addresses",
  "Why is this address risky?",
  "Analyse recent alerts",
  "Explain traffic anomalies",
  "Help me navigate",
  "Summarise this dashboard",
  "How does SentriX score risk?",
] as const

interface Props {
  onPick: (text: string) => void
  disabled?: boolean
}

export function SentrixAISuggestions({ onPick, disabled }: Props) {
  return (
    <div className="sai-suggest">
      {SENTRIX_AI_SUGGESTIONS.map((text) => (
        <button
          key={text}
          type="button"
          className="sai-suggest__chip"
          disabled={disabled}
          onClick={() => onPick(text)}
        >
          {text}
        </button>
      ))}
    </div>
  )
}
