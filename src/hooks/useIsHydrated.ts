"use client"

import { useSyncExternalStore } from "react"

const emptySubscribe = () => () => {}

/**
 * `false` during server render and the first client render, `true` once the
 * component has hydrated on the client.
 *
 * Replaces Framer's `useIsStaticRenderer()` for our purposes: it lets
 * interaction code stay inert until there is a real, interactive DOM.
 */
export function useIsHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}
