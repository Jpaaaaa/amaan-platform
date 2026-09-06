import { useCallback, useEffect, useRef, useState } from 'react'
import type { PlatformProductKey } from '@shared/platform-product'
import { fetchActivationRequests } from './api/activation-requests'
import { fetchAuthMe, logout } from './api/platform'
import { AppShell } from './components/AppShell'
import { AmanatTab } from './amanat/AmanatTab'
import { DevicesTab } from './devices/DevicesTab'
import { LoginPage } from './LoginPage'
import { ReleasesTab } from './releases/ReleasesTab'
import { RequestsTab } from './requests/RequestsTab'
import { cn, m3BtnOutline, sectionLabel, spinner } from './lib/ui'
import type { SessionState, TabId } from './types/device'
import './styles.css'

const PENDING_POLL_MS = 30_000

export function App() {
  const [session, setSession] = useState<SessionState>('loading')
  const [authEnabled, setAuthEnabled] = useState(false)
  const [tab, setTab] = useState<TabId>('devices')
  const [product, setProduct] = useState<PlatformProductKey>('bazar_one')
  const [devicesRefreshNonce, setDevicesRefreshNonce] = useState(0)
  const [devicesLoading, setDevicesLoading] = useState(false)
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0)
  const [amanatRefreshNonce, setAmanatRefreshNonce] = useState(0)
  const [amanatLoading, setAmanatLoading] = useState(false)

  const productRef = useRef(product)
  productRef.current = product

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

  useEffect(() => {
    if (session !== 'ok') return

    const pollPending = async () => {
      const result = await fetchActivationRequests(productRef.current, 'pending')
      if (result.ok) {
        setPendingRequestsCount(result.requests.length)
      } else if (result.unauthorized) {
        setPendingRequestsCount(0)
      }
    }

    void pollPending()
    const id = window.setInterval(() => void pollPending(), PENDING_POLL_MS)
    return () => window.clearInterval(id)
  }, [session, product])

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
      onRefreshAmanat={tab === 'amanat' ? () => setAmanatRefreshNonce((n) => n + 1) : undefined}
      amanatLoading={amanatLoading}
      pendingRequestsCount={pendingRequestsCount}
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

      {tab === 'requests' && (
        <RequestsTab
          key={product}
          product={product}
          refreshNonce={0}
          onLoadingChange={() => {}}
          onUnauthorized={onUnauthorized}
        />
      )}

      {tab === 'amanat' && (
        <AmanatTab
          refreshNonce={amanatRefreshNonce}
          onLoadingChange={setAmanatLoading}
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
