import type { PlatformUpdateHealthResponse, PlatformUpdateLatestResponse } from '@shared/types/app-update'
import { bentoCard, cn, statusBadge, statusDot } from '../lib/ui'
import { fmtIso } from './format'

export function ReleaseLiveSummary({
  manifest,
  health,
}: {
  manifest: PlatformUpdateLatestResponse | null
  health: PlatformUpdateHealthResponse | null
}) {
  const hasManifest = manifest && 'version' in manifest
  const healthy = Boolean(health?.directoryExists && health?.latestYmlExists)

  return (
    <section
      className={cn(
        bentoCard,
        'border border-brand/20 bg-gradient-to-br from-blue-100 via-blue-50 to-sky-50',
      )}
    >
      <div className="flex items-center gap-4">
        <div className={statusBadge(healthy)}>
          <span className={statusDot(healthy)} />
          {healthy ? 'Operational' : 'Issue Detected'}
        </div>
        <h2 className="text-xl font-extrabold tracking-tight text-label">
          {hasManifest ? `v${(manifest as { version: string }).version} is Live` : 'No Active Release'}
        </h2>
      </div>
      <p className="mt-3 text-[0.8125rem] font-medium text-label-2">
        {health?.latestYmlExists
          ? `Manifest synchronized · Published ${fmtIso((manifest as { releaseDate?: string | null })?.releaseDate ?? null)}`
          : 'System setup incomplete or pending first release.'}
      </p>
    </section>
  )
}
