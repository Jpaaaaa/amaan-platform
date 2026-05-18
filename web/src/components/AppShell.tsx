import type { PlatformProductKey } from '@shared/platform-product'
import type { TabId } from '../types/device'
import { cn, m3BtnText, spinner } from '../lib/ui'
import { Ico } from './icons'

const TAB_LABELS: Record<TabId, string> = {
  devices: 'Devices',
  releases: 'Releases',
  settings: 'Settings',
}

function navItem(active: boolean) {
  return cn(
    'flex h-full min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl border-0 bg-transparent text-on-surface-variant transition-[color,transform] active:scale-[0.96] [-webkit-tap-highlight-color:transparent]',
    active && 'font-semibold text-primary',
  )
}

function navIconWrap(active: boolean) {
  return cn(
    'flex h-8 w-14 shrink-0 items-center justify-center rounded-2xl transition-colors [&_svg]:h-[22px] [&_svg]:w-[22px]',
    active && 'bg-primary-container text-primary-on-container',
  )
}

export function AppShell({
  tab,
  product,
  onTabChange,
  onProductChange,
  onRefreshDevices,
  devicesLoading,
  children,
}: {
  tab: TabId
  product: PlatformProductKey
  onTabChange: (tab: TabId) => void
  onProductChange: (product: PlatformProductKey) => void
  onRefreshDevices?: () => void
  devicesLoading?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="min-h-dvh overflow-x-hidden">
      <header className="sticky top-4 z-[101] mx-auto w-[min(calc(100%-32px),600px)] rounded-[28px] border border-obsidian-border bg-obsidian-card shadow-premium backdrop-blur-[16px]">
        <div className="grid min-h-16 grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-2 sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-white to-[#e3f2ff] p-1 shadow-[0_4px_15px_rgba(0,153,255,0.3)] sm:h-11 sm:w-11">
              <img
                src="/amanlogo.png"
                alt="Amaan Logo"
                width={40}
                height={40}
                className="h-full w-full object-contain"
              />
            </div>
            <div className="flex shrink-0 gap-0.5 rounded-xl border border-slate-900/[0.08] bg-slate-900/[0.06] p-0.5">
              {(['sufra_lite', 'bazar_one'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={cn(
                    'h-7 cursor-pointer rounded-[9px] border-0 px-2 font-sans text-[0.625rem] font-extrabold uppercase tracking-wider transition-colors sm:px-2.5',
                    product === p
                      ? 'bg-white text-brand-deep shadow-sm'
                      : 'bg-transparent text-slate-900/45 hover:bg-slate-900/[0.04] hover:text-label',
                  )}
                  onClick={() => onProductChange(p)}
                >
                  {p.split('_')[0].toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <h1 className="truncate px-1 text-center text-base font-extrabold leading-tight tracking-tight text-label sm:text-lg">
            {TAB_LABELS[tab]}
          </h1>

          <div className="flex min-w-[40px] items-center justify-end sm:min-w-[48px]">
            {tab === 'devices' && onRefreshDevices ? (
              <button
                className={m3BtnText}
                type="button"
                onClick={onRefreshDevices}
                disabled={devicesLoading}
                aria-label="Refresh devices"
              >
                <div className={devicesLoading ? spinner : ''}>{Ico.refresh}</div>
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[600px] px-4 pb-[calc(88px+env(safe-area-inset-bottom))] pt-8">
        {children}
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-[100] border-t border-slate-900/[0.08] bg-white/80 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_32px_rgba(5,40,90,0.08)] backdrop-blur-[16px] backdrop-saturate-[160%]"
        role="navigation"
        aria-label="Primary"
      >
        <div className="mx-auto flex h-[72px] max-w-[600px] items-stretch justify-around gap-1 px-2 pt-1.5">
          <button
            type="button"
            className={navItem(tab === 'devices')}
            onClick={() => onTabChange('devices')}
            aria-current={tab === 'devices' ? 'page' : undefined}
          >
            <span className={navIconWrap(tab === 'devices')} aria-hidden>
              {Ico.devices}
            </span>
            <span className="truncate text-[0.6875rem] font-semibold tracking-wide">Devices</span>
          </button>
          <button
            type="button"
            className={navItem(tab === 'releases')}
            onClick={() => onTabChange('releases')}
            aria-current={tab === 'releases' ? 'page' : undefined}
          >
            <span className={navIconWrap(tab === 'releases')} aria-hidden>
              {Ico.releases}
            </span>
            <span className="truncate text-[0.6875rem] font-semibold tracking-wide">Releases</span>
          </button>
          <button
            type="button"
            className={navItem(tab === 'settings')}
            onClick={() => onTabChange('settings')}
            aria-current={tab === 'settings' ? 'page' : undefined}
          >
            <span className={navIconWrap(tab === 'settings')} aria-hidden>
              {Ico.settings}
            </span>
            <span className="truncate text-[0.6875rem] font-semibold tracking-wide">Settings</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
