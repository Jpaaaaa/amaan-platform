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
    <div className="app-shell" style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <header className="native-app-header" style={{ marginTop: 24 }}>
        <div className="native-app-header__inner" style={{ justifyContent: 'center' }}>
          <div className="native-app-header__logo-container">
            <img
              src="/amanlogo.png"
              alt="Amaan Logo"
              width={44}
              height={44}
              className="native-app-header__logo"
            />
          </div>
          <h1 className="native-app-header__title" style={{ marginLeft: 16 }}>Amaan Platform</h1>
        </div>
      </header>

      <main className="page" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: '10vh' }}>
        <div className="bento-card" style={{ width: '100%', maxWidth: 400, padding: 40, textAlign: 'center' }}>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--label)', marginBottom: 8, letterSpacing: '-0.02em' }}>Welcome back</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--md-on-surface-variant)' }}>Enter your admin credentials</p>
          </div>

          <form onSubmit={(ev) => void onSubmit(ev)}>
            <div className="ios-section" style={{ marginBottom: 24 }}>
              <div className="field">
                <label className="field__label" htmlFor="lm-password">Admin Password</label>
                <input
                  id="lm-password"
                  className="field__input"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={busy}
                  required
                  placeholder="••••••••"
                  style={{ textAlign: 'center', fontSize: '1.25rem' }}
                />
              </div>
            </div>

            {error && (
              <div className="alert" style={{ marginBottom: 24, borderRadius: 16 }}>{error}</div>
            )}

            <button 
              type="submit" 
              className="m3-btn m3-btn--primary" 
              style={{ width: '100%', height: 56, borderRadius: 16, fontSize: '1rem', fontWeight: 700 }} 
              disabled={busy}
            >
              {busy ? <span className="spinner" /> : 'Continue to Dashboard'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}

