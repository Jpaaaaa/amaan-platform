import { useState } from 'react'
import './styles.css'

const JSON_HEADERS: HeadersInit = { 'Content-Type': 'application/json' }

export function LoginPage({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const r = await fetch('/api/platform/auth/login', {
        method: 'POST',
        headers: JSON_HEADERS,
        credentials: 'include',
        body: JSON.stringify({ password }),
      })
      if (!r.ok) {
        const j = (await r.json().catch(() => ({}))) as { error?: string }
        throw new Error(
          j.error === 'INVALID_CREDENTIALS' ? 'Invalid password.' : r.statusText,
        )
      }
      onLoggedIn()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="app-shell">
      <header>
        <nav className="nav-bar" aria-label="App navigation">
          <div className="nav-bar__inner">
            <div className="nav-bar__brand">
              <span className="nav-bar__icon" aria-hidden>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M15.5 3.5a2.5 2.5 0 0 1 2.5 2.5v2h-4v-2a2.5 2.5 0 0 1 2.5-2.5Z"
                    stroke="currentColor"
                    strokeWidth="1.35"
                    strokeLinejoin="round"
                  />
                  <rect x="6" y="10" width="13" height="10.5" rx="2" stroke="currentColor" strokeWidth="1.35" />
                  <circle cx="10" cy="15" r="1.4" fill="currentColor" />
                  <path d="M14 15h4.5" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
                </svg>
              </span>
              <div className="nav-bar__titles">
                <h1 className="nav-bar__title">LM App</h1>
                <p className="nav-bar__subtitle">Sign in to manage licenses and releases</p>
              </div>
            </div>
          </div>
        </nav>
      </header>

      <main className="page" style={{ paddingTop: 24 }}>
        <div className="ios-section" style={{ maxWidth: 400, margin: '0 auto' }}>
          <form onSubmit={(ev) => void onSubmit(ev)}>
            <div className="field" style={{ borderRadius: 0 }}>
              <label className="field__label" htmlFor="lm-password">
                Admin password
              </label>
              <input
                id="lm-password"
                className="field__input"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={busy}
                required
              />
            </div>
            {error ? (
              <p className="alert" role="alert" style={{ margin: '12px 16px 0', borderRadius: 10 }}>
                {error}
              </p>
            ) : null}
            <div style={{ padding: '16px 16px 20px' }}>
              <button type="submit" className="act-btn act-btn--blue" disabled={busy} style={{ width: '100%' }}>
                {busy ? 'Signing in…' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
