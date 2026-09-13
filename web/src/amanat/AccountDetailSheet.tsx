import { useCallback, useEffect, useState } from 'react'
import { fetchAmanatAccount, type AdminAccountDetail, type AdminAccountUser } from '../api/amanat'
import {
  alertBox,
  cn,
  iosSection,
  m3BtnTonal,
  spinner,
} from '../lib/ui'
import { Overlay } from '../components/ui/Overlay'
import { ResetPasswordModal } from './ResetPasswordModal'
import { formatSubscriptionDate } from './subscription-status'

function roleLabel(role: string): string {
  return role.replace(/_/g, ' ').toLowerCase()
}

export function AccountDetailSheet({
  subscriptionId,
  accountName,
  onClose,
  onUnauthorized,
}: {
  subscriptionId: string
  accountName: string
  onClose: () => void
  onUnauthorized: () => void
}) {
  const [account, setAccount] = useState<AdminAccountDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resetUser, setResetUser] = useState<AdminAccountUser | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchAmanatAccount(subscriptionId)
      if (!result.ok) {
        if (result.unauthorized) onUnauthorized()
        else setError(result.error)
        setAccount(null)
        return
      }
      setAccount(result.data)
    } finally {
      setLoading(false)
    }
  }, [subscriptionId, onUnauthorized])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <>
      <Overlay open title="Account" onClose={onClose}>
            <p className="pb-1 text-lg font-bold text-label">{accountName}</p>
            {account && (
              <p className="pb-4 text-xs capitalize text-on-surface-variant">
                {account.accountType} · {account.tier.toLowerCase()}
                {account.isLocked ? ' · locked' : ''}
              </p>
            )}

            {loading && (
              <div className="flex justify-center py-10">
                <span className={cn(spinner, 'h-8 w-8')} />
              </div>
            )}

            {error && (
              <div className={cn(alertBox, 'mb-4 rounded-2xl')}>{error}</div>
            )}

            {account && !loading && (
              <>
                <div className={cn(iosSection, 'mb-4')}>
                  <div className="field-row border-t-0 px-4 py-3">
                    <p className="text-[0.625rem] font-bold uppercase tracking-wider text-label-3">
                      Subscription period
                    </p>
                    <p className="mt-1 text-sm text-label">
                      {formatSubscriptionDate(account.startsAt)} –{' '}
                      {formatSubscriptionDate(account.endsAt)}
                    </p>
                  </div>
                  {account.joinCode && (
                    <div className="field-row border-t border-slate-900/[0.06] px-4 py-3">
                      <p className="text-[0.625rem] font-bold uppercase tracking-wider text-label-3">
                        Join code
                      </p>
                      <p className="mt-1 font-mono text-sm font-semibold text-label">
                        {account.joinCode}
                      </p>
                    </div>
                  )}
                </div>

                <p className="mb-2 text-[0.6875rem] font-bold uppercase tracking-widest text-label-3">
                  {account.accountType === 'individual' ? 'User' : 'Users & agents'}
                </p>

                {account.accountUsers.length === 0 ? (
                  <p className="pb-6 text-sm text-on-surface-variant">No users found.</p>
                ) : (
                  <div className="space-y-2 pb-2">
                    {account.accountUsers.map((user) => (
                      <div
                        key={user.id}
                        className="rounded-2xl border border-obsidian-border bg-white p-4"
                      >
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <p className="font-bold text-label">{user.fullName}</p>
                          <span className="shrink-0 rounded-full bg-slate-900/[0.06] px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wide text-label-3">
                            {roleLabel(user.role)}
                          </span>
                        </div>
                        {user.officeName && (
                          <p className="mb-2 text-xs text-on-surface-variant">
                            Office: {user.officeName}
                          </p>
                        )}
                        <p className="break-all text-sm text-label-2">
                          <span className="text-[0.625rem] font-bold uppercase tracking-wider text-label-3">
                            Email{' '}
                          </span>
                          {user.email}
                        </p>
                        <button
                          type="button"
                          className={cn(m3BtnTonal, 'mt-3 h-10 w-full text-sm')}
                          onClick={() => setResetUser(user)}
                        >
                          Reset password
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
      </Overlay>

      {resetUser && (
        <ResetPasswordModal
          subscriptionId={subscriptionId}
          user={resetUser}
          onClose={() => setResetUser(null)}
          onUnauthorized={onUnauthorized}
        />
      )}
    </>
  )
}
