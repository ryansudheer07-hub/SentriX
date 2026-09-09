/** SentriX-style "thinking" indicator — three gold dots, not a spinner. */
export function SentrixAITyping() {
  return (
    <div
      className="sai-typing"
      role="status"
      aria-label="SentriX AI is thinking"
    >
      <span className="sai-typing__dot" />
      <span className="sai-typing__dot" />
      <span className="sai-typing__dot" />
    </div>
  )
}
