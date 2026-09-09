"use client"

import type { ReactNode } from "react"

import { useAuth } from "./AuthProvider"
import { LoginScreen } from "./LoginScreen"

/**
 * Renders the authenticated app when a session is valid, the login screen
 * otherwise. The boot intro and ambient field render outside this gate.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { status } = useAuth()

  if (status === "loading") {
    return (
      <div className="auth-boot" aria-busy="true">
        Authenticating…
      </div>
    )
  }

  if (status === "anon") return <LoginScreen />

  return <>{children}</>
}
