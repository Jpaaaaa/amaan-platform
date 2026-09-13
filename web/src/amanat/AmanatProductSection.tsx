import { useCallback, useState } from 'react'
import { clearAmanatToken, isAmanatAuthenticated } from '../lib/amanat-auth'
import type { WorkspaceIntent } from '../lib/workspace-intent'
import { AmanatLoginForm } from './AmanatLoginForm'

export type AmanatSection = 'subscriptions' | 'zones'
import { SubscriptionsList } from './SubscriptionsList'
import { ZonesEditor } from './ZonesEditor'

export function AmanatProductSection({
  section,
  refreshNonce = 0,
  intent,
  onLoadingChange,
}: {
  section: AmanatSection
  refreshNonce?: number
  intent?: WorkspaceIntent | null
  onLoadingChange?: (loading: boolean) => void
}) {
  const [authed, setAuthed] = useState(() => isAmanatAuthenticated())

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

  if (section === 'subscriptions') {
    return (
      <SubscriptionsList
        refreshNonce={refreshNonce}
        intent={intent}
        onLoadingChange={onLoadingChange}
        onUnauthorized={handleUnauthorized}
        onSignOut={handleSignOut}
      />
    )
  }

  return (
    <ZonesEditor
      refreshNonce={refreshNonce}
      onLoadingChange={onLoadingChange}
      onUnauthorized={handleUnauthorized}
      onSignOut={handleSignOut}
    />
  )
}
