"use client"

import { useCallback, useEffect, useReducer, useRef, useState } from "react"

import { useAuth } from "@/components/auth/AuthProvider"
import { runAiAction } from "@/lib/ai/actions"
import { clearConversation, postChat } from "@/lib/ai/client"
import { AI_OPEN_EVENT } from "@/lib/ai/events"
import { buildAiRequestContext, useSentrixContext } from "@/lib/ai/context"
import { aiReducer, initialAiState, type AiState } from "@/lib/ai/reducer"
import type { AiAction, ChatMessage } from "@/lib/ai/types"

const STORAGE_KEY = "sentrix.ai.session"
const MAX_PERSISTED = 40

interface Persisted {
  conversationId: string | null
  messages: ChatMessage[]
}

/**
 * Conversation lives in `sessionStorage` only (never `localStorage`) and never
 * carries a token — it is a UX convenience, not a trust boundary. A parse
 * failure or private-mode throw just starts a fresh conversation.
 */
function loadPersisted(): Persisted | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Persisted
    if (!parsed || !Array.isArray(parsed.messages)) return null
    return parsed
  } catch {
    return null
  }
}

function savePersisted(data: Persisted): void {
  try {
    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        conversationId: data.conversationId,
        messages: data.messages.slice(-MAX_PERSISTED),
      })
    )
  } catch {
    /* quota / private mode — the assistant still works in memory */
  }
}

function clearPersisted(): void {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

let seq = 0
const nextId = () => `m${Date.now().toString(36)}-${(seq++).toString(36)}`

/** Console footprint (brief §20). */
export type AiMode = "compact" | "expanded" | "rail"
const MODE_ORDER: AiMode[] = ["compact", "expanded", "rail"]
const MODE_KEY = "sentrix.ai.mode"

function loadMode(): AiMode {
  try {
    const m = window.localStorage.getItem(MODE_KEY)
    return m === "expanded" || m === "rail" ? m : "compact"
  } catch {
    return "compact"
  }
}
function saveMode(m: AiMode): void {
  try {
    window.localStorage.setItem(MODE_KEY, m)
  } catch {
    /* pref only */
  }
}

export interface SentrixAIController {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
  mode: AiMode
  cycleMode: () => void
  state: AiState
  canSend: boolean
  send: (text: string) => void
  retry: () => void
  clear: () => void
  runAction: (action: AiAction) => void
}

export function useSentrixAI(): SentrixAIController {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<AiMode>(loadMode)

  const cycleMode = useCallback(() => {
    setMode((cur) => {
      const next = MODE_ORDER[(MODE_ORDER.indexOf(cur) + 1) % MODE_ORDER.length]
      saveMode(next)
      return next
    })
  }, [])

  // The assistant only ever renders client-side (`ssr: false`), so lazy
  // initialisers can read sessionStorage straight away — no hydrate effect.
  const [state, dispatch] = useReducer(aiReducer, undefined, (): AiState => {
    const saved = loadPersisted()
    return saved
      ? { messages: saved.messages, status: "idle", error: null }
      : initialAiState
  })
  const [conversationId, setConversationId] = useState<string | null>(
    () => loadPersisted()?.conversationId ?? null
  )

  const { context, setContext, dispatchCommand } = useSentrixContext()
  const { user } = useAuth()
  const role = user?.role

  // Guards a second send while one is in flight (written only in callbacks).
  const inFlight = useRef(false)

  // Publish the current route into the shared context the assistant reads.
  useEffect(() => {
    setContext({ route: window.location.pathname })
  }, [setContext])

  // Mirror the conversation into sessionStorage whenever it changes.
  useEffect(() => {
    savePersisted({ conversationId, messages: state.messages })
  }, [conversationId, state.messages])

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((v) => !v), [])

  // Let the command palette (and later phases) open the console.
  useEffect(() => {
    const onOpen = () => setIsOpen(true)
    window.addEventListener(AI_OPEN_EVENT, onOpen)
    return () => window.removeEventListener(AI_OPEN_EVENT, onOpen)
  }, [])

  const runAction = useCallback(
    (action: AiAction) => {
      runAiAction(action, { dispatchCommand })
    },
    [dispatchCommand]
  )

  const deliver = useCallback(
    async (text: string, append: boolean) => {
      if (inFlight.current) return
      inFlight.current = true
      if (append) {
        dispatch({
          kind: "send",
          message: { id: nextId(), role: "user", text, at: Date.now() },
        })
      } else {
        dispatch({ kind: "retry" })
      }
      try {
        const res = await postChat(
          text,
          conversationId,
          buildAiRequestContext(context, role)
        )
        setConversationId(res.conversation_id)
        const reply: ChatMessage = {
          id: nextId(),
          role: "assistant",
          text: res.message,
          at: Date.now(),
          sources: res.sources,
          actions: res.actions,
        }
        dispatch({ kind: "received", message: reply })
        for (const action of reply.actions ?? []) {
          runAiAction(action, { dispatchCommand })
        }
      } catch (err) {
        dispatch({
          kind: "failed",
          error:
            err instanceof Error
              ? err.message
              : "SentriX AI is unavailable right now.",
        })
      } finally {
        inFlight.current = false
      }
    },
    [context, role, conversationId, dispatchCommand]
  )

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (trimmed) void deliver(trimmed, true)
    },
    [deliver]
  )

  const retry = useCallback(() => {
    const lastUser = [...state.messages].reverse().find((m) => m.role === "user")
    if (lastUser) void deliver(lastUser.text, false)
  }, [deliver, state.messages])

  const clear = useCallback(() => {
    const id = conversationId
    dispatch({ kind: "clear" })
    setConversationId(null)
    clearPersisted()
    if (id) void clearConversation(id).catch(() => {})
  }, [conversationId])

  return {
    isOpen,
    open,
    close,
    toggle,
    mode,
    cycleMode,
    state,
    canSend: state.status !== "sending",
    send,
    retry,
    clear,
    runAction,
  }
}
