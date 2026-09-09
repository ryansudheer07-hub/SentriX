"use client"

interface Props {
  isOpen: boolean
  onToggle: () => void
}

/**
 * The always-present ₿ coin, fixed to the bottom-right of the viewport. It is a
 * real <button>, so Enter/Space activate it for free; the pulse/glow live in
 * CSS and go quiet under `prefers-reduced-motion`.
 */
export function SentrixAIButton({ isOpen, onToggle }: Props) {
  return (
    <button
      type="button"
      className={"sai-fab" + (isOpen ? " sai-fab--open" : "")}
      aria-label={
        isOpen ? "Close SentriX AI assistant" : "Open SentriX AI assistant"
      }
      aria-expanded={isOpen}
      aria-haspopup="dialog"
      onClick={onToggle}
    >
      <span className="sai-fab__label" aria-hidden="true">
        Ask SentriX
      </span>
      <span className="sai-fab__glow" aria-hidden="true" />
      <span className="sai-fab__ring" aria-hidden="true" />
      <span className="sai-fab__mark" aria-hidden="true">
        {isOpen ? "✕" : "₿"}
      </span>
    </button>
  )
}
