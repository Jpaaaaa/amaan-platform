import type { ReactNode } from 'react'
import { AccentTile } from '../components/ui/DeckPrimitives'
import { Ico } from '../components/icons'
import { PRODUCT_META } from '../constants/products'
import { useWorkspace } from '../context/WorkspaceContext'
import { isAmanatProduct } from '../lib/product-nav'
import { cn } from '../lib/ui'
import type { TabId } from '../types/device'

export type MoreModuleTab = Extract<TabId, 'releases' | 'zones' | 'settings'>

type Module = {
  key: string
  title: string
  subtitle: string
  icon: ReactNode
  route?: MoreModuleTab
  soon?: boolean
}

export function MoreTab({ onOpen }: { onOpen: (route: MoreModuleTab) => void }) {
  const { product } = useWorkspace()
  const workspace = PRODUCT_META[product]
  const amanat = isAmanatProduct(product)

  const groups: { heading: string; items: Module[] }[] = [
    {
      heading: 'Operations',
      items: amanat
        ? [
            {
              key: 'zones',
              title: 'Zones',
              subtitle: 'Neighborhood maps',
              icon: Ico.zones,
              route: 'zones',
            },
          ]
        : [
            {
              key: 'releases',
              title: 'Releases',
              subtitle: 'Update packages',
              icon: Ico.releases,
              route: 'releases',
            },
          ],
    },
    {
      heading: 'Coming later',
      items: [
        { key: 'users', title: 'Users & roles', subtitle: 'Permissions', icon: Ico.users, soon: true },
        { key: 'reports', title: 'Reports', subtitle: 'Exports and summaries', icon: Ico.reports, soon: true },
        { key: 'finance', title: 'Finance', subtitle: 'Invoices and billing', icon: Ico.finance, soon: true },
      ],
    },
    {
      heading: 'Account',
      items: [
        {
          key: 'settings',
          title: 'Settings',
          subtitle: 'Account and sign out',
          icon: Ico.settings,
          route: 'settings',
        },
      ],
    },
  ]

  return (
    <>
      <div className="mb-5 flex items-center gap-3 rounded-card border border-obsidian-border bg-surface p-4 shadow-premium">
        <AccentTile color={workspace.accent}>{workspace.short.slice(0, 1)}</AccentTile>
        <div className="min-w-0">
          <p className="text-xs font-medium text-label-2">Current workspace</p>
          <p className="truncate text-[15px] font-bold text-label">{workspace.label}</p>
          <p className="mt-0.5 text-xs text-label-3">Switch this on the Workspaces tab</p>
        </div>
      </div>

      {groups.map((group) => (
        <section key={group.heading} className="mb-5">
          <h2 className="mb-2 px-1 text-xs font-semibold text-label-2">{group.heading}</h2>
          <div className="overflow-hidden rounded-card border border-obsidian-border bg-surface shadow-premium">
            {group.items.map((item, i) => {
              const Row = item.soon ? 'div' : 'button'
              return (
                <Row
                  key={item.key}
                  type={item.soon ? undefined : 'button'}
                  disabled={item.soon}
                  onClick={item.route && !item.soon ? () => onOpen(item.route!) : undefined}
                  className={cn(
                    'flex w-full items-center gap-3 px-3.5 py-3 text-left',
                    i < group.items.length - 1 && 'border-b border-obsidian-border',
                    item.soon ? 'cursor-default opacity-55' : 'cursor-pointer border-0 bg-transparent hover:bg-surface-muted',
                  )}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-surface-muted text-label [&_svg]:h-5 [&_svg]:w-5">
                    {item.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold text-label">{item.title}</span>
                    <span className="block text-xs text-label-2">{item.subtitle}</span>
                  </span>
                  {item.soon ? (
                    <span className="text-[11px] font-bold tracking-wide text-label-3">Soon</span>
                  ) : (
                    <span className="text-label-3">{Ico.chevron}</span>
                  )}
                </Row>
              )
            })}
          </div>
        </section>
      ))}
    </>
  )
}
