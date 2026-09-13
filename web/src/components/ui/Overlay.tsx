import { useEffect, type ReactNode } from 'react'
import { cn } from '../../lib/ui'

export function Overlay({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[200] flex animate-fade-in items-end justify-center bg-[rgba(17,24,39,0.48)] lg:items-stretch lg:justify-end"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="overlay-title"
        className="flex max-h-[92dvh] w-full flex-col rounded-t-[20px] border border-obsidian-border bg-surface shadow-sheet lg:h-full lg:max-h-none lg:w-[min(460px,100%)] lg:rounded-l-[20px] lg:rounded-r-none lg:border-y-0 lg:border-r-0 lg:shadow-drawer"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-2 h-1 w-9 shrink-0 rounded-full bg-obsidian-border lg:hidden" aria-hidden />
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-obsidian-border px-4 py-3">
          <h2 id="overlay-title" className="truncate text-base font-bold text-label">
            {title}
          </h2>
          <button
            type="button"
            className="cursor-pointer rounded-lg border-0 bg-transparent px-2 py-1 text-sm font-medium text-label-2 hover:bg-surface-muted"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          {children}
        </div>
        {footer ? (
          <div className="shrink-0 border-t border-obsidian-border px-4 py-3">{footer}</div>
        ) : null}
      </div>
    </div>
  )
}

export function StatusChip({
  label,
  tone,
}: {
  label: string
  tone: 'success' | 'warning' | 'danger' | 'neutral' | 'brand'
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.6875rem] font-semibold',
        tone === 'success' && 'border-success/20 bg-success-muted text-success',
        tone === 'warning' && 'border-warning/20 bg-warning-muted text-warning',
        tone === 'danger' && 'border-danger/20 bg-danger-muted text-danger',
        tone === 'brand' && 'border-brand/20 bg-brand-muted text-brand-deep',
        tone === 'neutral' && 'border-obsidian-border bg-surface-muted text-label-2',
      )}
    >
      {label}
    </span>
  )
}
