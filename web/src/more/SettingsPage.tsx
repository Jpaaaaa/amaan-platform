import { useWorkspace } from '../context/WorkspaceContext'
import { isAmanatProduct } from '../lib/product-nav'
import { cn, m3BtnOutline, sectionLabel } from '../lib/ui'
import { BackToMore } from './BackToMore'

export function SettingsPage({
  authEnabled,
  onLogout,
  onBack,
}: {
  authEnabled: boolean
  onLogout: () => void
  onBack?: () => void
}) {
  const { product } = useWorkspace()

  return (
    <>
      {onBack ? <BackToMore onBack={onBack} /> : null}

      <p className={sectionLabel}>Session</p>
      {authEnabled ? (
        <button
          type="button"
          className={cn(m3BtnOutline, 'mb-7 min-h-12 w-full')}
          onClick={() => void onLogout()}
        >
          Sign out
        </button>
      ) : (
        <p className="mb-7 text-[0.9375rem] leading-normal text-on-surface-variant">
          Admin password is not enabled on this server.
        </p>
      )}
      <p className={sectionLabel}>About</p>
      <p className="text-sm leading-relaxed text-label-2">
        {isAmanatProduct(product)
          ? 'Amanat — manage real estate subscriptions and neighborhood zones.'
          : 'LM App — manage device licenses and publish client updates for the selected product.'}
      </p>
    </>
  )
}
