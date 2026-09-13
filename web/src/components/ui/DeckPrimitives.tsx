import type { ReactNode } from 'react'
import { cn } from '../../lib/ui'

/** Deck layout contract — metric row, optional chart, then activity + shortcuts. */
export type MetricTone =
  | 'brand'
  | 'success'
  | 'warning'
  | 'danger'
  | 'neutral'
  | 'peach'
  | 'teal'
  | 'violet'

const TILE_TONE: Record<MetricTone, string> = {
  brand: 'bg-brand-muted text-brand-deep',
  success: 'bg-success-muted text-success',
  warning: 'bg-warning-muted text-warning',
  danger: 'bg-danger-muted text-danger',
  neutral: 'bg-surface-muted text-label-2',
  peach: 'bg-[#FDE8D0] text-[#C2410C]',
  teal: 'bg-[#D1FAE5] text-[#0F766E]',
  violet: 'bg-[#EDE9FE] text-[#6D28D9]',
}

export function AccentTile({
  children,
  tone = 'brand',
  color,
  size = 'md',
  className,
}: {
  children: ReactNode
  tone?: MetricTone
  color?: string
  size?: 'sm' | 'md'
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center font-bold [&_svg]:h-[18px] [&_svg]:w-[18px]',
        size === 'sm' ? 'h-7 w-7 rounded-xl text-[11px]' : 'h-10 w-10 rounded-2xl text-sm',
        !color && TILE_TONE[tone],
        className,
      )}
      style={color ? { backgroundColor: `${color}33`, color } : undefined}
    >
      {children}
    </span>
  )
}

export function MetricCard({
  kicker,
  value,
  caption,
  tone = 'brand',
  icon,
  onClick,
  layout = 'stack',
  className,
}: {
  kicker: string
  value: ReactNode
  caption?: string
  tone?: MetricTone
  icon?: ReactNode
  onClick?: () => void
  layout?: 'stack' | 'row'
  className?: string
}) {
  const inner =
    layout === 'row' ? (
      <>
        <AccentTile tone={tone}>{icon ?? String(value).slice(0, 1)}</AccentTile>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-label">{kicker}</span>
          {caption ? <span className="block text-xs text-label-2">{caption}</span> : null}
        </span>
        <span className="text-lg font-bold tabular-nums text-label">{value}</span>
      </>
    ) : (
      <>
        <AccentTile tone={tone} className="mb-4">
          {icon ?? String(value).slice(0, 1)}
        </AccentTile>
        <span className="block text-xs font-semibold text-label-2">{kicker}</span>
        <span className="mt-1 block text-2xl font-bold tabular-nums tracking-tight text-label">
          {value}
        </span>
        {caption ? <span className="mt-1 block text-xs text-label-2">{caption}</span> : null}
      </>
    )

  const cardClass = cn(
    'rounded-card border border-obsidian-border bg-surface p-4 shadow-premium',
    layout === 'row' && 'flex w-full items-center gap-3 text-left',
    onClick && 'cursor-pointer transition-colors hover:bg-surface-muted',
    className,
  )

  if (onClick) {
    return (
      <button type="button" className={cardClass} onClick={onClick}>
        {inner}
      </button>
    )
  }

  return <div className={cardClass}>{inner}</div>
}

export function ChartPanel({
  title,
  period,
  children,
  className,
}: {
  title: string
  period?: ReactNode
  children?: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'flex min-h-[200px] flex-col rounded-card bg-slate-800 p-5 text-white shadow-premium',
        className,
      )}
    >
      <header className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        {period ? <div className="text-xs text-white/70">{period}</div> : null}
      </header>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  )
}

export function DeckPageGrid({
  metrics,
  chart,
  table,
  side,
}: {
  metrics: ReactNode
  chart?: ReactNode
  table: ReactNode
  side?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 lg:grid-cols-12">
        <div
          className={cn(
            'grid gap-4',
            chart ? 'sm:grid-cols-3 lg:col-span-8' : 'sm:grid-cols-2 lg:col-span-12 lg:grid-cols-4',
          )}
        >
          {metrics}
        </div>
        {chart ? <div className="lg:col-span-4">{chart}</div> : null}
      </div>
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">{table}</div>
        {side ? <div className="lg:col-span-4">{side}</div> : null}
      </div>
    </div>
  )
}
