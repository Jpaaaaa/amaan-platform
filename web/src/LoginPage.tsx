import { useState } from 'react'
import {
  alertBox,
  bentoCard,
  cn,
  fieldInput,
  iosSection,
  m3BtnPrimary,
  spinner,
} from './lib/ui'

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
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-4 z-[101] mx-auto mt-6 w-[min(calc(100%-32px),600px)] rounded-[28px] border border-obsidian-border bg-obsidian-card shadow-premium backdrop-blur-[16px]">
        <div className="flex min-h-16 items-center justify-center px-5 py-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-gradient-to-br from-white to-[#e3f2ff] p-1 shadow-[0_4px_15px_rgba(0,153,255,0.3)]">
            <img
              src="/amanlogo.png"
              alt="Amaan Logo"
              width={44}
              height={44}
              className="h-full w-full object-contain"
            />
          </div>
          <h1 className="ml-4 text-lg font-extrabold tracking-tight text-label">Amaan Platform</h1>
        </div>
      </header>

      <main className="mx-auto flex flex-1 max-w-[600px] items-center justify-center px-4 pb-[10vh] pt-8">
        <div className={cn(bentoCard, 'w-full max-w-[400px] p-10 text-center')}>
          <div className="mb-8">
            <h2 className="mb-2 text-[1.75rem] font-extrabold tracking-tight text-label">
              Welcome back
            </h2>
            <p className="text-sm text-on-surface-variant">Enter your admin credentials</p>
          </div>

          <form onSubmit={(ev) => void onSubmit(ev)}>
            <div className={cn(iosSection, 'mb-6')}>
              <div className="field-row border-t-0 px-4 py-3 pb-3.5">
                <label
                  className="mb-1.5 block text-[0.6875rem] font-bold uppercase tracking-wider text-label-2"
                  htmlFor="lm-password"
                >
                  Admin Password
                </label>
                <input
                  id="lm-password"
                  className={cn(fieldInput, 'text-center text-xl')}
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

            {error && <div className={cn(alertBox, 'mb-6 rounded-2xl')}>{error}</div>}

            <button
              type="submit"
              className={cn(m3BtnPrimary, 'h-14 w-full rounded-2xl text-base font-bold')}
              disabled={busy}
            >
              {busy ? <span className={spinner} /> : 'Continue to Dashboard'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
