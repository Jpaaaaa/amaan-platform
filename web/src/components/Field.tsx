import { cn } from '../lib/ui'

export function Field({
  label,
  hint,
  children,
  first = false,
}: {
  label: string
  hint?: string
  children: React.ReactNode
  first?: boolean
}) {
  return (
    <div className={cn('field-row border-t border-slate-900/[0.08] px-4 py-3 pb-3.5', first && 'border-t-0')}>
      <label className="mb-1.5 block text-[0.6875rem] font-bold uppercase tracking-wider text-label-2">
        {label}
      </label>
      {children}
      {hint ? (
        <p className="pb-2 text-xs leading-snug text-label-3">{hint}</p>
      ) : null}
    </div>
  )
}
