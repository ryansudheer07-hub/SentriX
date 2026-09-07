"use client"

import { useState } from "react"

import { SentrixWordmark } from "@/components/SentrixWordmark"
import { useAuth } from "./AuthProvider"

const DEMO = [
  { username: "analyst1", password: "analyst123", role: "analyst" },
  { username: "investigator1", password: "investigate123", role: "investigator" },
  { username: "admin", password: "admin123", role: "admin" },
]

export function LoginScreen() {
  const { login, error } = useAuth()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    try {
      await login(username.trim(), password)
    } catch {
      /* error surfaced via useAuth().error */
    } finally {
      setBusy(false)
    }
  }

  const fillDemo = (d: (typeof DEMO)[number]) => {
    setUsername(d.username)
    setPassword(d.password)
  }

  return (
    <section className="login">
      <div className="login__inner">
        <SentrixWordmark as="div" animate={false} className="login__wordmark" />
        <p className="login__eyebrow">
          Blockchain Forensics <span aria-hidden="true">·</span> Investigator
          Workstation
        </p>

        <form className="login__card" onSubmit={submit}>
          <p className="eyebrow eyebrow--gold">Secure Sign-in</p>

          <label className="login__field">
            <span className="eyebrow">Username</span>
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </label>

          <label className="login__field">
            <span className="eyebrow">Password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error && (
            <p className="login__error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="btn btn--gold login__submit"
            disabled={busy}
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>

          <div className="login__demo">
            <span className="eyebrow">Demo accounts</span>
            <div className="login__demo-row">
              {DEMO.map((d) => (
                <button
                  key={d.username}
                  type="button"
                  className="login__demo-chip"
                  onClick={() => fillDemo(d)}
                >
                  {d.role}
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </section>
  )
}
