"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"

import * as authApi from "@/lib/api/auth"
import { getToken, UNAUTHORIZED_EVENT } from "@/lib/api/client"
import type { ApiUser } from "@/lib/api/types"

type AuthStatus = "loading" | "authed" | "anon"

interface AuthContextValue {
  status: AuthStatus
  user: ApiUser | null
  error: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading")
  const [user, setUser] = useState<ApiUser | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Validate a stored token on load.
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      await Promise.resolve()
      if (cancelled) return
      if (!getToken()) {
        setStatus("anon")
        return
      }
      try {
        const current = await authApi.me()
        if (cancelled) return
        setUser(current)
        setStatus("authed")
      } catch {
        if (cancelled) return
        authApi.logout()
        setUser(null)
        setStatus("anon")
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [])

  // A 401 from any request drops the session.
  useEffect(() => {
    const onUnauthorized = () => {
      setUser(null)
      setStatus("anon")
      setError("Session expired — please sign in again.")
    }
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    setError(null)
    try {
      const current = await authApi.login(username, password)
      setUser(current)
      setStatus("authed")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.")
      throw err
    }
  }, [])

  const logout = useCallback(() => {
    authApi.logout()
    setUser(null)
    setStatus("anon")
    setError(null)
  }, [])

  return (
    <AuthContext.Provider value={{ status, user, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>")
  return ctx
}
