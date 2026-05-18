/** Shared Tailwind class strings for the platform UI. */

export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ')
}

export const fieldInput =
  'block w-full min-w-0 border-0 bg-transparent p-1 font-sans text-base font-medium leading-snug text-label outline-none appearance-none placeholder:text-label-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2'

export const fieldSelect = cn(
  fieldInput,
  'cursor-pointer bg-[length:20px] bg-[right_0_center] bg-no-repeat pr-7',
  "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%2379747E' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")]",
)

export const fieldTextarea = cn(fieldInput, 'min-h-[88px] resize-y align-top')

export const fieldSuffix = 'shrink-0 min-w-3 text-[0.8125rem] font-semibold text-label-3'

export const fieldInline = 'flex w-full items-center gap-2.5'

export const m3Btn =
  'inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-3xl border-0 px-6 font-sans text-sm font-medium transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40'

export const m3BtnPrimary = cn(m3Btn, 'bg-primary text-primary-on')

export const m3BtnTonal = cn(m3Btn, 'bg-[#e2e8f0] text-label')

export const m3BtnOutline = cn(
  m3Btn,
  'border border-[#cbd5e1] bg-transparent text-primary',
)

export const m3BtnText = cn(m3Btn, 'bg-transparent text-primary')

export const spinner =
  'inline-block h-[18px] w-[18px] animate-spin rounded-full border-2 border-slate-900/10 border-t-accent'

export const bentoCard =
  'mb-6 rounded-card border border-obsidian-border bg-obsidian-card p-6 shadow-premium backdrop-blur-[16px]'

export const bentoTitle =
  'mb-5 text-sm font-extrabold uppercase tracking-widest text-brand-mid'

export const iosSection =
  'mb-6 overflow-hidden rounded-[20px] border border-obsidian-border bg-[#f8fafc]'

export const sectionLabel =
  'px-1 pb-2.5 text-[0.6875rem] font-bold uppercase tracking-widest text-label-3'

export const alertBox =
  'mb-[18px] flex items-start gap-3 rounded-card border border-red-200 bg-red-50 p-3.5 text-sm leading-snug text-red-700 shadow-sm'

export const deviceCard =
  'mb-3 flex w-full min-w-0 cursor-pointer items-center justify-between gap-3 rounded-2xl border border-obsidian-border bg-white p-4 px-5 text-left transition-all duration-300 hover:scale-[1.01] hover:border-brand/30 hover:bg-[#f8fafc]'

export const emptyState =
  'flex flex-col items-center gap-3 rounded-card border-2 border-dashed border-[#e2e8f0] bg-white/85 px-5 py-12 text-label-3'

export function statusBadge(active: boolean): string {
  return cn(
    'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[0.6875rem] font-extrabold uppercase tracking-wider',
    active
      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500'
      : 'border-red-500/20 bg-red-500/10 text-red-500',
  )
}

export function statusDot(active: boolean): string {
  return cn(
    'h-1.5 w-1.5 rounded-full',
    active ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500',
  )
}

export const sheetBackdrop =
  'fixed inset-0 z-[200] flex animate-fade-in items-center justify-center bg-slate-900/35 p-4 backdrop-blur-[2px] pt-[max(16px,env(safe-area-inset-top))] pb-[max(20px,env(safe-area-inset-bottom))] sm:p-6 sm:pb-[max(28px,env(safe-area-inset-bottom))]'

export const sheetPanel =
  'max-h-[min(88dvh,720px)] w-full max-w-[min(520px,100%)] animate-modal-enter overflow-y-auto overscroll-contain rounded-sheet border border-slate-900/[0.08] bg-surface shadow-[0_4px_8px_-2px_rgba(15,40,80,0.08),0_24px_48px_-12px_rgba(15,40,80,0.18)] sm:max-h-[min(85dvh,760px)] sm:max-w-[540px]'

export const sheetNav =
  'sticky top-0 z-[1] flex items-center justify-between gap-2.5 border-b border-slate-900/[0.08] bg-surface px-4 py-2.5 pb-3'

export const sheetNavBtn =
  'min-w-16 cursor-pointer rounded-lg border-0 bg-transparent px-1 py-2 font-sans text-[0.9375rem] font-medium text-label-3 transition-colors hover:bg-accent-muted hover:text-accent disabled:cursor-not-allowed disabled:opacity-40'

export const sheetNavBtnBold = cn(sheetNavBtn, 'font-bold text-accent')

export const sheetNavTitle =
  'text-base font-bold tracking-tight text-label'

export const sheetContent = 'pb-7'
