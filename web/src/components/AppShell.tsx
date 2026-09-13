import type { ReactNode } from 'react'
import { useWorkspace } from '../context/WorkspaceContext'
import type { ShellTabId, TabId } from '../types/device'
import {
  SHELL_TAB_IDS,
  TAB_LABELS,
  isAmanatProduct,
  isMoreModuleTab,
} from '../lib/product-nav'
import { cn, m3BtnText, spinner } from '../lib/ui'
import { Ico } from './icons'

const SHELL_TAB_ICONS: Record<ShellTabId, ReactNode> = {
  deck: Ico.deck,
  workspaces: Ico.workspaces,
  more: Ico.more,
}

function BottomNavButton({
  tabId,
  label,
  icon,
  active,
  badge,
  onClick,
}: {
  tabId: TabId
  label: string
  icon: ReactNode
  active: boolean
  badge?: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={cn(
        'flex h-full min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-none border-0 bg-transparent text-label-3 transition-colors [-webkit-tap-highlight-color:transparent]',
        active && 'font-bold text-brand',
      )}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      data-tab={tabId}
    >
      <span className="relative flex h-6 items-center justify-center [&_svg]:h-[22px] [&_svg]:w-[22px]" aria-hidden>
        {icon}
        {badge != null && badge > 0 ? (
          <span className="absolute -right-2.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[0.625rem] font-bold leading-none text-white">
            {badge > 99 ? '99+' : badge}
          </span>
        ) : null}
      </span>
      <span className={cn('truncate text-[11px]', active ? 'font-bold' : 'font-medium')}>
        {label}
      </span>
    </button>
  )
}

function RailButton({
  tabId,
  label,
  icon,
  active,
  badge,
  onClick,
}: {
  tabId: TabId
  label: string
  icon: ReactNode
  active: boolean
  badge?: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      data-tab={tabId}
      className={cn(
        'relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl border-0 bg-transparent text-label-3 transition-colors hover:bg-surface-muted hover:text-label',
        active && 'bg-brand-muted text-brand',
      )}
      onClick={onClick}
    >
      <span className="[&_svg]:h-5 [&_svg]:w-5" aria-hidden>
        {icon}
      </span>
      {badge != null && badge > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[0.625rem] font-bold leading-none text-white">
          {badge > 99 ? '99+' : badge}
        </span>
      ) : null}
    </button>
  )
}

function RefreshButtons({
  showDevicesRefresh,
  showAmanatRefresh,
  onRefreshDevices,
  devicesLoading,
  onRefreshAmanat,
  amanatLoading,
}: {
  showDevicesRefresh: boolean
  showAmanatRefresh: boolean
  onRefreshDevices?: () => void
  devicesLoading?: boolean
  onRefreshAmanat?: () => void
  amanatLoading?: boolean
}) {
  if (showDevicesRefresh) {
    return (
      <button
        className={m3BtnText}
        type="button"
        onClick={onRefreshDevices}
        disabled={devicesLoading}
        aria-label="Refresh devices"
      >
        <div className={devicesLoading ? spinner : ''}>{Ico.refresh}</div>
      </button>
    )
  }
  if (showAmanatRefresh) {
    return (
      <button
        className={m3BtnText}
        type="button"
        onClick={onRefreshAmanat}
        disabled={amanatLoading}
        aria-label="Refresh Amanat data"
      >
        <div className={amanatLoading ? spinner : ''}>{Ico.refresh}</div>
      </button>
    )
  }
  return null
}

export function AppShell({
  tab,
  onTabChange,
  onRefreshDevices,
  devicesLoading,
  onRefreshAmanat,
  amanatLoading,
  pendingRequestsCount,
  children,
}: {
  tab: TabId
  onTabChange: (tab: TabId) => void
  onRefreshDevices?: () => void
  devicesLoading?: boolean
  onRefreshAmanat?: () => void
  amanatLoading?: boolean
  pendingRequestsCount?: number
  children: React.ReactNode
}) {
  const { product } = useWorkspace()
  const amanatProduct = isAmanatProduct(product)
  const showDevicesRefresh =
    Boolean(onRefreshDevices) && (tab === 'workspaces' || tab === 'devices' || tab === 'deck')
  const showAmanatRefresh =
    Boolean(onRefreshAmanat) &&
    (tab === 'workspaces' ||
      tab === 'deck' ||
      (amanatProduct && (tab === 'subscriptions' || tab === 'zones')))

  const refresh = (
    <RefreshButtons
      showDevicesRefresh={showDevicesRefresh}
      showAmanatRefresh={showAmanatRefresh && !showDevicesRefresh}
      onRefreshDevices={onRefreshDevices}
      devicesLoading={devicesLoading}
      onRefreshAmanat={onRefreshAmanat}
      amanatLoading={amanatLoading}
    />
  )

  const navItems = SHELL_TAB_IDS.map((tabId) => ({
    tabId,
    label: TAB_LABELS[tabId],
    icon: SHELL_TAB_ICONS[tabId],
    active: tab === tabId || (tabId === 'more' && isMoreModuleTab(tab)),
    badge: tabId === 'workspaces' ? pendingRequestsCount : undefined,
    onClick: () => onTabChange(tabId),
  }))

  return (
    <div className="min-h-dvh overflow-x-hidden bg-obsidian-bg">
      <header className="sticky top-0 z-[101] border-b border-obsidian-border bg-surface lg:hidden">
        <div className="mx-auto grid min-h-14 w-full max-w-[600px] grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-brand-muted p-1">
              <img
                src="/amanlogo.png"
                alt="Amaan Logo"
                width={36}
                height={36}
                className="h-full w-full object-contain"
              />
            </div>
          </div>

          <h1 className="truncate px-1 text-center text-base font-bold leading-tight tracking-tight text-label sm:text-lg">
            {TAB_LABELS[tab]}
          </h1>

          <div className="flex min-w-[40px] items-center justify-end gap-2 sm:min-w-[48px]">
            {refresh}
          </div>
        </div>
      </header>

      <div className="lg:flex lg:min-h-dvh lg:p-3">
        <div className="mx-auto w-full max-w-[600px] lg:mx-0 lg:flex lg:max-w-none lg:min-h-[calc(100dvh-24px)] lg:overflow-hidden lg:rounded-island lg:border lg:border-obsidian-border lg:bg-surface lg:shadow-island">
          <aside className="hidden w-[72px] shrink-0 flex-col items-center border-r border-obsidian-border py-4 lg:flex">
            <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-muted p-1.5">
              <img
                src="/amanlogo.png"
                alt="Amaan Logo"
                width={32}
                height={32}
                className="h-full w-full object-contain"
              />
            </div>
            <nav className="flex flex-col items-center gap-1.5" aria-label="Primary">
              {navItems.map((item) => (
                <RailButton key={item.tabId} {...item} />
              ))}
            </nav>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="hidden items-center gap-4 px-6 py-4 lg:flex">
              <h1 className="min-w-0 flex-1 truncate text-xl font-bold tracking-tight text-label">
                {TAB_LABELS[tab]}
              </h1>
              {refresh}
            </header>

            <main className="w-full px-4 pb-[calc(72px+env(safe-area-inset-bottom))] pt-6 lg:px-6 lg:pb-8 lg:pt-2">
              {children}
            </main>
          </div>
        </div>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-[100] border-t border-obsidian-border bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
        role="navigation"
        aria-label="Primary"
      >
        <div className="mx-auto flex h-[56px] max-w-[600px] items-stretch justify-around px-1 pt-1.5">
          {navItems.map((item) => (
            <BottomNavButton key={item.tabId} {...item} />
          ))}
        </div>
      </nav>
    </div>
  )
}
