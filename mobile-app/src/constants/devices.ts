export const DEVICE_TIERS = ['5d', '15d', '1m', '2m', 'lifetime', 'custom'] as const

export const DEVICE_TIER_LABELS: Record<string, string> = {
  '5d': '5 days',
  '15d': '15 days',
  '1m': '1 month',
  '2m': '2 months',
  lifetime: 'Lifetime',
  custom: 'Custom',
}
