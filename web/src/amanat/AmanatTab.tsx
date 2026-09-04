import { useCallback, useState } from 'react'
import { clearAmanatToken, isAmanatAuthenticated } from '../lib/amanat-auth'
import { cn } from '../lib/ui'
import { AmanatLoginForm } from './AmanatLoginForm'
import { SubscriptionsList } from './SubscriptionsList'
import { ZonesEditor } from './ZonesEditor'

export type AmanatSection = 'subscriptions' | 'zones'

const SECTION_TABS: { id: AmanatSection; label: string }[] = [
  { id: 'subscriptions', label: 'Subscriptions' },
  { id: 'zones', label: 'Zones' },
]

export function AmanatTab({
  refreshNonce = 0,
  onLoadingChange,
}: {
  refreshNonce?: number
  onLoadingChange?: (loading: boolean) => void
}) {
  const [authed, setAuthed] = useState(() => isAmanatAuthenticated())
  const [section, setSection] = useState<AmanatSection>('subscriptions')

  const handleUnauthorized = useCallback(() => {
    clearAmanatToken()
    setAuthed(false)
  }, [])

  const handleSignOut = useCallback(() => {
    clearAmanatToken()
    setAuthed(false)
  }, [])

  if (!authed) {
    return <AmanatLoginForm onLoggedIn={() => setAuthed(true)} />
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap gap-2">
        {SECTION_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={cn(
              'rounded-xl px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors',
              section === tab.id
                ? 'bg-primary text-primary-on'
                : 'bg-slate-900/[0.06] text-label-3 hover:text-label',
            )}
            onClick={() => setSection(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {section === 'subscriptions' ? (
        <SubscriptionsList
          refreshNonce={refreshNonce}
          onLoadingChange={onLoadingChange}
          onUnauthorized={handleUnauthorized}
          onSignOut={handleSignOut}
        />
      ) : (
        <ZonesEditor
          refreshNonce={refreshNonce}
          onLoadingChange={onLoadingChange}
          onUnauthorized={handleUnauthorized}
          onSignOut={handleSignOut}
        />
      )}
    </>
  )
}
