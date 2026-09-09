import { apiFetch } from "@/lib/api/client"
import type { AiStatus, ChatResponse } from "./types"

export function getAiStatus(): Promise<AiStatus> {
  return apiFetch<AiStatus>("/ai/status")
}

export function postChat(
  message: string,
  conversationId: string | null,
  context: Record<string, unknown> | null
): Promise<ChatResponse> {
  return apiFetch<ChatResponse>("/ai/chat", {
    method: "POST",
    body: {
      message,
      conversation_id: conversationId ?? undefined,
      context: context ?? undefined,
    },
  })
}

export function clearConversation(conversationId: string): Promise<void> {
  return apiFetch<void>(
    `/ai/conversations/${encodeURIComponent(conversationId)}/clear`,
    { method: "POST" }
  )
}
