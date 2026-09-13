import { cn } from '../../lib/ui'

export type FilterOption<K extends string> = {
  key: K
  label: string
  count?: number
}

export function FilterBar<K extends string>({
  value,
  onChange,
  options,
}: {
  value: K
  onChange: (key: K) => void
  options: FilterOption<K>[]
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = opt.key === value
        return (
          <button
            key={opt.key}
            type="button"
            className={cn(
              'cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
              active
                ? 'border-brand bg-brand-muted text-brand-deep'
                : 'border-obsidian-border bg-surface text-label-2 hover:bg-surface-muted',
            )}
            onClick={() => onChange(opt.key)}
          >
            {opt.label}
            {opt.count != null ? (
              <span className={cn('ml-1', active ? 'text-brand' : 'text-label-3')}>
                {opt.count}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
