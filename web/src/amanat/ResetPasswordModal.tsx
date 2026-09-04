import { useState } from 'react'
import { resetAmanatUserPassword, type AdminAccountUser } from '../api/amanat'
import {
  alertBox,
  cn,
  iosSection,
  m3BtnOutline,
  m3BtnPrimary,
  sheetBackdrop,
  sheetContent,
  sheetNav,
  sheetNavBtn,
  sheetNavTitle,
  sheetPanel,
  spinner,
} from '../lib/ui'

type Step = 'confirm' | 'result'

export function ResetPasswordModal({
  subscriptionId,
  user,
  onClose,
  onUnauthorized,
}: {
  subscriptionId: string
  user: AdminAccountUser
  onClose: () => void
  onUnauthorized: () => void
}) {
  const [step, setStep] = useState<Step>('confirm')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleGenerate() {
    setBusy(true)
    setError(null)
    try {
      const result = await resetAmanatUserPassword(subscriptionId, user.id)
      if (!result.ok) {
        if (result.unauthorized) onUnauthorized()
        else setError(result.error)
        return
      }
      setNewPassword(result.data.newPassword)
      setStep('result')
    } finally {
      setBusy(false)
    }
  }

  async function handleCopy() {
    if (!newPassword) return
    await navigator.clipboard.writeText(newPassword)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      role="presentation"
      className={cn(sheetBackdrop, 'z-[210]')}
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-password-title"
        className={sheetPanel}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={sheetNav}>
          <button className={sheetNavBtn} type="button" onClick={onClose} disabled={busy}>
            {step === 'result' ? 'Done' : 'Cancel'}
          </button>
          <span id="reset-password-title" className={sheetNavTitle}>
            Reset password
          </span>
          <span className="min-w-16" aria-hidden />
        </div>

        <div className={sheetContent}>
          <p className="px-4 pb-4 text-sm text-on-surface-variant">
            <span className="font-semibold text-label">{user.fullName}</span>
            <br />
            {user.email}
          </p>

          {step === 'confirm' && (
            <div className="px-4 pb-6">
              <div className={cn(iosSection, 'mb-4 rounded-[20px]')}>
                <p className="px-4 py-3 text-sm leading-relaxed text-label-2">
                  A new easy-to-type password will be generated automatically. Share it
                  securely with the user and ask them to change it after signing in.
                </p>
              </div>

              {error && (
                <div className={cn(alertBox, 'mb-4 rounded-2xl')}>{error}</div>
              )}

              <button
                type="button"
                className={cn(m3BtnPrimary, 'w-full')}
                disabled={busy}
                onClick={() => void handleGenerate()}
              >
                {busy ? <span className={cn(spinner, 'h-4 w-4 border-t-primary-on')} /> : 'Generate password'}
              </button>
            </div>
          )}

          {step === 'result' && newPassword && (
            <div className="px-4 pb-6">
              <div className={cn(iosSection, 'mb-4 rounded-[20px]')}>
                <div className="field-row border-t-0 px-4 py-3">
                  <p className="text-[0.625rem] font-bold uppercase tracking-wider text-label-3">
                    New password
                  </p>
                  <p className="mt-2 font-mono text-xl font-semibold tracking-wide text-label">
                    {newPassword}
                  </p>
                </div>
                <div className="field-row border-t border-slate-900/[0.06] px-4 py-3">
                  <p className="text-sm leading-relaxed text-label-2">
                    Shown once — copy before closing. Ask the user to change it after they
                    sign in.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className={cn(m3BtnOutline, 'w-full')}
                onClick={() => void handleCopy()}
              >
                {copied ? 'Copied' : 'Copy password'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
