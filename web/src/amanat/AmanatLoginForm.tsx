import { useState } from 'react'
import { amanatLogin } from '../api/amanat'
import { setAmanatToken } from '../lib/amanat-auth'
import {
  alertBox,
  bentoCard,
  cn,
  fieldInput,
  iosSection,
  m3BtnPrimary,
  spinner,
} from '../lib/ui'

export function AmanatLoginForm({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const result = await amanatLogin(email.trim(), password)
      if (!result.ok) {
        throw new Error(result.error)
      }
      setAmanatToken(result.data.accessToken)
      onLoggedIn()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={cn(bentoCard, 'mx-auto max-w-[400px] p-8 text-center')}>
      <div className="mb-8">
        <h2 className="mb-2 text-xl font-extrabold tracking-tight text-label">Amanat Admin</h2>
        <p className="text-sm text-on-surface-variant">
          Sign in with your platform operator credentials
        </p>
      </div>

      <form onSubmit={(ev) => void onSubmit(ev)}>
        <div className={cn(iosSection, 'mb-4 text-left')}>
          <div className="field-row border-t-0 px-4 py-3 pb-3.5">
            <label
              className="mb-1.5 block text-[0.6875rem] font-bold uppercase tracking-wider text-label-2"
              htmlFor="amanat-email"
            >
              Email
            </label>
            <input
              id="amanat-email"
              className={fieldInput}
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
              required
              placeholder="admin@amanat.iq"
            />
          </div>
          <div className="field-row border-t border-slate-900/[0.06] px-4 py-3 pb-3.5">
            <label
              className="mb-1.5 block text-[0.6875rem] font-bold uppercase tracking-wider text-label-2"
              htmlFor="amanat-password"
            >
              Password
            </label>
            <input
              id="amanat-password"
              className={fieldInput}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
              required
              placeholder="••••••••"
            />
          </div>
        </div>

        {error && <div className={cn(alertBox, 'mb-4 rounded-2xl text-left')}>{error}</div>}

        <button
          type="submit"
          className={cn(m3BtnPrimary, 'h-12 w-full rounded-2xl text-base font-bold')}
          disabled={busy}
        >
          {busy ? <span className={spinner} /> : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
