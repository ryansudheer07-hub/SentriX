import type { ChatMessage } from "./types"

export interface AiState {
  messages: ChatMessage[]
  status: "idle" | "sending" | "error"
  error: string | null
}

export const initialAiState: AiState = { messages: [], status: "idle", error: null }

export type AiEvent =
  | { kind: "hydrate"; messages: ChatMessage[] }
  | { kind: "send"; message: ChatMessage }
  | { kind: "retry" }
  | { kind: "received"; message: ChatMessage }
  | { kind: "failed"; error: string }
  | { kind: "clear" }

export function aiReducer(state: AiState, ev: AiEvent): AiState {
  switch (ev.kind) {
    case "hydrate":
      return { messages: ev.messages, status: "idle", error: null }
    case "send":
      return { messages: [...state.messages, ev.message], status: "sending", error: null }
    case "retry":
      // Re-send the last user turn without appending a duplicate bubble.
      return { ...state, status: "sending", error: null }
    case "received":
      return { messages: [...state.messages, ev.message], status: "idle", error: null }
    case "failed":
      return { ...state, status: "error", error: ev.error }
    case "clear":
      return { ...initialAiState }
    default:
      return state
  }
}
