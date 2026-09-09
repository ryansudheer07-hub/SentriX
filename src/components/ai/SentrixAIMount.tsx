"use client"

import dynamic from "next/dynamic"

/**
 * Client boundary that code-splits the assistant. `ssr: false` keeps it purely
 * client-side (it depends on `sessionStorage` and browser-only context) and out
 * of the first dashboard payload.
 */
const SentrixAI = dynamic(
  () => import("./SentrixAI").then((m) => m.SentrixAI),
  { ssr: false }
)

export function SentrixAIMount() {
  return <SentrixAI />
}
