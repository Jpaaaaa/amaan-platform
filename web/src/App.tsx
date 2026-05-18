import { useCallback, useEffect, useState } from 'react'
import type { PlatformProductKey } from '@shared/platform-product'
import { fetchAuthMe, logout } from './api/platform'
import { AppShell } from './components/AppShell'
import { DevicesTab } from './devices/DevicesTab'
import { LoginPage } from './LoginPage'
import { ReleasesTab } from './releases/ReleasesTab'
import { cn, m3BtnOutline, sectionLabel, spinner } from './lib/ui'
import type { SessionState, TabId } from './types/device'
import './styles.css'

export function App() {
  const [session, setSession] = useState<SessionState>('loading')
  const [authEnabled, setAuthEnabled] = useState(false)
  const [tab, setTab] = useState<TabId>('devices')
  const [product, setProduct] = useState<PlatformProductKey>('bazar_one')
  const [devicesRefreshNonce, setDevicesRefreshNonce] = useState(0)
  const [devicesLoading, setDevicesLoading] = useState(false)

  const onUnauthorized = useCallback(() => setSession('anon'), [])

  useEffect(() => {
    void (async () => {
      try {
        const j = await fetchAuthMe()
        const ae = Boolean(j.authEnabled)
        setAuthEnabled(ae)
        if (!ae) setSession('ok')
        else if (j.ok) setSession('ok')
        else setSession('anon')
      } catch {
        setAuthEnabled(false)
        setSession('ok')
      }
    })()
  }, [])

  async function handleLogout() {
    try {
      await logout()
    } finally {
      setSession('anon')
    }
  }

  if (session === 'loading') {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className={cn(spinner, 'h-10 w-10 border-primary/30 border-t-transparent')} />
      </div>
    )
  }

  if (authEnabled && session === 'anon') {
    return <LoginPage onLoggedIn={() => setSession('ok')} />
  }

  return (
    <AppShell
      tab={tab}
      product={product}
      onTabChange={setTab}
      onProductChange={setProduct}
      onRefreshDevices={tab === 'devices' ? () => setDevicesRefreshNonce((n) => n + 1) : undefined}
      devicesLoading={devicesLoading}
    >
      {tab === 'releases' && (
        <ReleasesTab product={product} onUnauthorized={onUnauthorized} />
      )}

      {tab === 'devices' && (
        <DevicesTab
          key={product}
          product={product}
          refreshNonce={devicesRefreshNonce}
          onLoadingChange={setDevicesLoading}
          onUnauthorized={onUnauthorized}
        />
      )}

      {tab === 'settings' && (
        <>
          <p className={sectionLabel}>Session</p>
          {authEnabled ? (
            <button
              type="button"
              className={cn(m3BtnOutline, 'mb-7 min-h-12 w-full')}
              onClick={() => void handleLogout()}
            >
              Sign out
            </button>
          ) : (
            <p className="mb-7 text-[0.9375rem] leading-normal text-on-surface-variant">
              Admin password is not enabled on this server.
            </p>
          )}
          <p className={sectionLabel}>About</p>
          <p className="text-sm leading-relaxed text-label-2">
            LM App — manage device licenses and publish client updates for the selected product.
          </p>
        </>
      )}
    </AppShell>
  )
}
