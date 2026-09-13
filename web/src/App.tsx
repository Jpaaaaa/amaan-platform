import { useCallback, useEffect, useRef, useState } from 'react'
import { PLATFORM_PRODUCT_AMANAT } from '@shared/platform-product'
import { fetchActivationRequests } from './api/activation-requests'
import { fetchAuthMe, logout } from './api/platform'
import { AppShell } from './components/AppShell'
import { AmanatProductSection } from './amanat/AmanatProductSection'
import { DeckTab } from './deck/DeckTab'
import { DevicesTab } from './devices/DevicesTab'
import { LoginPage } from './LoginPage'
import { BackToMore } from './more/BackToMore'
import { MoreTab } from './more/MoreTab'
import { SettingsPage } from './more/SettingsPage'
import { ReleasesTab } from './releases/ReleasesTab'
import { RequestsTab } from './requests/RequestsTab'
import { useWorkspace } from './context/WorkspaceContext'
import { WorkspaceSwitcher } from './components/WorkspaceSwitcher'
import { defaultShellTab, isAmanatProduct, isLicenseProduct } from './lib/product-nav'
import { cn, spinner } from './lib/ui'
import type { WorkspaceIntent } from './lib/workspace-intent'
import type { SessionState, TabId } from './types/device'
import './styles.css'

const PENDING_POLL_MS = 30_000

export function App() {
  const { product } = useWorkspace()
  const [session, setSession] = useState<SessionState>('loading')
  const [authEnabled, setAuthEnabled] = useState(false)
  const [tab, setTab] = useState<TabId>(defaultShellTab)
  const [devicesRefreshNonce, setDevicesRefreshNonce] = useState(0)
  const [devicesLoading, setDevicesLoading] = useState(false)
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0)
  const [amanatRefreshNonce, setAmanatRefreshNonce] = useState(0)
  const [amanatLoading, setAmanatLoading] = useState(false)
  const [workspaceIntent, setWorkspaceIntent] = useState<WorkspaceIntent | null>(null)

  const productRef = useRef(product)
  productRef.current = product

  const onUnauthorized = useCallback(() => setSession('anon'), [])
  const openWorkspaces = useCallback((next: WorkspaceIntent) => {
    setWorkspaceIntent(next)
    setTab('workspaces')
  }, [])
  const onTabChange = useCallback((next: TabId) => {
    setWorkspaceIntent(null)
    setTab(next)
  }, [])

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
    if (isAmanatProduct(productRef.current)) {
      setPendingRequestsCount(0)
      return
    }

    const pollPending = async () => {
      if (isAmanatProduct(productRef.current)) return
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

  useEffect(() => {
    setWorkspaceIntent(null)
    if (tab === 'releases' && isAmanatProduct(product)) setTab('more')
    if (tab === 'zones' && !isAmanatProduct(product)) setTab('more')
    // tab is read for the bounce only; do not depend on it or Deck deep-links lose intent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product])

  async function handleLogout() {
    try {
      await logout()
    } finally {
      setSession('anon')
    }
  }

  if (session === 'loading') {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-obsidian-bg">
        <div className={cn(spinner, 'h-10 w-10 border-brand/30 border-t-transparent')} />
      </div>
    )
  }

  if (authEnabled && session === 'anon') {
    return <LoginPage onLoggedIn={() => setSession('ok')} />
  }

  const licenseProduct = isLicenseProduct(product) ? product : null
  const showDevices =
    Boolean(licenseProduct) && (tab === 'workspaces' || tab === 'devices')
  const showAmanatSubscriptions =
    product === PLATFORM_PRODUCT_AMANAT &&
    (tab === 'workspaces' || tab === 'subscriptions')
  const showAmanatRefresh =
    showAmanatSubscriptions ||
    (product === PLATFORM_PRODUCT_AMANAT && (tab === 'zones' || tab === 'deck'))
  const showLicenseDeckRefresh = Boolean(licenseProduct) && tab === 'deck'

  return (
    <AppShell
      tab={tab}
      onTabChange={onTabChange}
      onRefreshDevices={
        (showDevices || showLicenseDeckRefresh) && licenseProduct
          ? () => setDevicesRefreshNonce((n) => n + 1)
          : undefined
      }
      devicesLoading={devicesLoading}
      onRefreshAmanat={showAmanatRefresh ? () => setAmanatRefreshNonce((n) => n + 1) : undefined}
      amanatLoading={amanatLoading}
      pendingRequestsCount={isAmanatProduct(product) ? 0 : pendingRequestsCount}
    >
      {tab === 'deck' && (
        <DeckTab
          refreshNonce={licenseProduct ? devicesRefreshNonce : amanatRefreshNonce}
          onLoadingChange={licenseProduct ? setDevicesLoading : setAmanatLoading}
          onUnauthorized={onUnauthorized}
          onOpenWorkspaces={openWorkspaces}
        />
      )}

      {(showDevices || showAmanatSubscriptions) && (
        <div className="mb-4">
          <WorkspaceSwitcher />
        </div>
      )}

      {showDevices && licenseProduct && (
        <DevicesTab
          key={licenseProduct}
          product={licenseProduct}
          refreshNonce={devicesRefreshNonce}
          pendingCount={pendingRequestsCount}
          intent={workspaceIntent}
          onLoadingChange={setDevicesLoading}
          onUnauthorized={onUnauthorized}
        />
      )}

      {showAmanatSubscriptions && (
        <AmanatProductSection
          section="subscriptions"
          refreshNonce={amanatRefreshNonce}
          intent={workspaceIntent}
          onLoadingChange={setAmanatLoading}
        />
      )}

      {tab === 'more' && <MoreTab onOpen={setTab} />}

      {licenseProduct && tab === 'releases' && (
        <>
          <BackToMore onBack={() => setTab('more')} />
          <ReleasesTab product={licenseProduct} onUnauthorized={onUnauthorized} />
        </>
      )}

      {licenseProduct && tab === 'requests' && (
        <RequestsTab
          key={licenseProduct}
          product={licenseProduct}
          refreshNonce={0}
          onLoadingChange={() => {}}
          onUnauthorized={onUnauthorized}
        />
      )}

      {product === PLATFORM_PRODUCT_AMANAT && tab === 'zones' && (
        <>
          <BackToMore onBack={() => setTab('more')} />
          <AmanatProductSection
            section="zones"
            refreshNonce={amanatRefreshNonce}
            onLoadingChange={setAmanatLoading}
          />
        </>
      )}

      {tab === 'settings' && (
        <SettingsPage
          authEnabled={authEnabled}
          onLogout={() => void handleLogout()}
          onBack={() => setTab('more')}
        />
      )}
    </AppShell>
  )
}
