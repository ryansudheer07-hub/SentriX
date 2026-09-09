import { describe, expect, it } from "vitest"

import { aiReducer, initialAiState } from "./reducer"
import type { ChatMessage } from "./types"

const msg = (role: ChatMessage["role"], text: string): ChatMessage => ({
  id: `${role}-${text}`,
  role,
  text,
  at: 0,
})

describe("aiReducer", () => {
  it("starts idle with no messages", () => {
    expect(initialAiState).toEqual({ messages: [], status: "idle", error: null })
  })

  it("hydrate replaces the message list and resets status/error", () => {
    const seeded = aiReducer(
      { messages: [], status: "error", error: "boom" },
      { kind: "hydrate", messages: [msg("user", "hi"), msg("assistant", "hey")] }
    )
    expect(seeded.messages).toHaveLength(2)
    expect(seeded.status).toBe("idle")
    expect(seeded.error).toBeNull()
  })

  it("send appends the user turn and flips to sending", () => {
    const next = aiReducer(initialAiState, { kind: "send", message: msg("user", "q") })
    expect(next.messages).toEqual([msg("user", "q")])
    expect(next.status).toBe("sending")
    // original state untouched
    expect(initialAiState.messages).toHaveLength(0)
  })

  it("retry flips to sending without appending a duplicate", () => {
    const sent = aiReducer(initialAiState, { kind: "send", message: msg("user", "q") })
    const failed = aiReducer(sent, { kind: "failed", error: "network" })
    const retried = aiReducer(failed, { kind: "retry" })
    expect(retried.messages).toHaveLength(1)
    expect(retried.status).toBe("sending")
    expect(retried.error).toBeNull()
  })

  it("received appends the assistant turn and returns to idle", () => {
    const sent = aiReducer(initialAiState, { kind: "send", message: msg("user", "q") })
    const done = aiReducer(sent, { kind: "received", message: msg("assistant", "a") })
    expect(done.messages.map((m) => m.role)).toEqual(["user", "assistant"])
    expect(done.status).toBe("idle")
  })

  it("failed keeps messages and records the error", () => {
    const sent = aiReducer(initialAiState, { kind: "send", message: msg("user", "q") })
    const failed = aiReducer(sent, { kind: "failed", error: "timeout" })
    expect(failed.messages).toHaveLength(1)
    expect(failed.status).toBe("error")
    expect(failed.error).toBe("timeout")
  })

  it("clear returns a fresh state", () => {
    const dirty = aiReducer(initialAiState, { kind: "send", message: msg("user", "q") })
    expect(aiReducer(dirty, { kind: "clear" })).toEqual(initialAiState)
  })
})
