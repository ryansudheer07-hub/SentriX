"use client"

import { useState } from "react"

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
      <form className="login__panel" onSubmit={submit}>
        <p className="login__hud">
          <span className="login__hud-dot" aria-hidden="true" />
          SENTRIX <span className="login__hud-sep">/</span> FORENSIC CORE
        </p>

        <p className="login__mark">SENTRIX</p>

        <span className="login__rule" aria-hidden="true" />

        <p className="login__eyebrow">Workstation Access</p>
        <h1 className="login__title">Enter the investigator workstation.</h1>
        <p className="login__desc">
          The gateway is ready. Authenticate to resume your case workspace.
        </p>

        <div className="login__fields">
          <label className="login__field">
            <span>Username</span>
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </label>
          <label className="login__field">
            <span>Password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
        </div>

        {error && (
          <p className="login__error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="login__auth" disabled={busy}>
          <span>{busy ? "Authenticating…" : "Authenticate"}</span>
          <span className="login__auth-arrow" aria-hidden="true">
            ↗
          </span>
        </button>

        <div className="login__demo">
          <span className="login__demo-label">Demo</span>
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

        <p className="login__foot" aria-hidden="true">
          <span>NETWORK: BITCOIN</span>
          <span>BUILD 2.4.1</span>
        </p>
      </form>
    </section>
  )
}
