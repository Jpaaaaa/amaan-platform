import { useState } from 'react'
import { PRODUCT_META, PRODUCT_OPTIONS } from '../constants/products'
import { useWorkspace } from '../context/WorkspaceContext'
import { cn } from '../lib/ui'
import type { PlatformProductKey } from '@shared/platform-product'
import { AccentTile } from './ui/DeckPrimitives'

export function WorkspaceSwitcher() {
  const { product, setProduct } = useWorkspace()
  const [open, setOpen] = useState(false)
  const meta = PRODUCT_META[product]

  function choose(key: PlatformProductKey) {
    setProduct(key)
    setOpen(false)
  }

  return (
    <div className="rounded-card border border-obsidian-border bg-surface shadow-premium">
      <button
        type="button"
        className="flex w-full cursor-pointer items-center gap-3 border-0 bg-transparent px-4 py-3.5 text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`Workspace ${meta.label}`}
      >
        <AccentTile color={meta.accent}>{meta.short.slice(0, 1)}</AccentTile>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold text-label-3">Workspace</span>
          <span className="block truncate text-[15px] font-bold text-label">{meta.label}</span>
        </span>
        <span className="text-label-3" aria-hidden>
          {open ? '▴' : '▾'}
        </span>
      </button>

      {open ? (
        <div className="border-t border-obsidian-border p-2">
          {PRODUCT_OPTIONS.map((opt) => {
            const active = opt.key === product
            return (
              <button
                key={opt.key}
                type="button"
                className={cn(
                  'flex w-full cursor-pointer items-center gap-3 rounded-2xl border-0 bg-transparent p-2.5 text-left',
                  active && 'bg-brand-muted',
                )}
                onClick={() => choose(opt.key)}
              >
                <AccentTile color={opt.accent}>{opt.short.slice(0, 1)}</AccentTile>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold text-label">{opt.label}</span>
                  <span className="block text-xs text-label-2">{opt.blurb}</span>
                </span>
                {active ? <span className="text-sm font-bold text-brand">✓</span> : null}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
