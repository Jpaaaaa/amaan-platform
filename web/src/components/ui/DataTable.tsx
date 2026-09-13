import type { ReactNode } from 'react'
import { cn, emptyState, spinner } from '../../lib/ui'
import { Ico } from '../icons'

export type DataTableColumn<T> = {
  key: string
  header: string
  className?: string
  render: (row: T) => ReactNode
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  loading,
  emptyTitle,
  emptyBody,
}: {
  columns: DataTableColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
  loading?: boolean
  emptyTitle?: string
  emptyBody?: string
}) {
  if (loading && rows.length === 0) {
    return (
      <div className={emptyState}>
        <span className={cn(spinner, 'h-8 w-8')} />
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className={emptyState}>
        {Ico.empty}
        <p className="text-base font-bold text-label-2">{emptyTitle ?? 'Nothing here'}</p>
        {emptyBody ? (
          <p className="max-w-[280px] text-center text-sm leading-relaxed">{emptyBody}</p>
        ) : null}
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-card border border-obsidian-border bg-surface shadow-premium">
      <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-obsidian-border bg-surface-muted">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-3 py-2.5 text-xs font-semibold tracking-wide text-label-2',
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className={cn(
                'border-b border-obsidian-border last:border-b-0',
                onRowClick && 'cursor-pointer hover:bg-surface-muted',
              )}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((col) => (
                <td key={col.key} className={cn('px-3 py-2.5 text-label', col.className)}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  )
}
