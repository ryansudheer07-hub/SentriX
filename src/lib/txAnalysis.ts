/**
 * Decoupled signal for "analyse this transaction query". The header search
 * dispatches it; the Transaction Analysis section at the bottom of the
 * dashboard listens, populates its charts and scrolls itself into view.
 * Same pattern as `ai/events.ts`.
 */
export const TX_ANALYZE_EVENT = "sentrix:analyze-tx"

export interface TxAnalyzeDetail {
  query: string
}

export function requestTxAnalysis(query: string): void {
  if (typeof window === "undefined") return
  const q = query.trim()
  if (!q) return
  window.dispatchEvent(
    new CustomEvent<TxAnalyzeDetail>(TX_ANALYZE_EVENT, { detail: { query: q } })
  )
}
