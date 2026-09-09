/**
 * A tiny decoupled signal for "open the SentriX AI console". The command
 * palette (and later phases) dispatch it; `useSentrixAI` listens. This keeps
 * the AI open-state where it lives without threading a prop through the shell
 * or widening the AI module's surface.
 */
export const AI_OPEN_EVENT = "sentrix:ai-open"

export function requestOpenSentrixAI(): void {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(AI_OPEN_EVENT))
}
