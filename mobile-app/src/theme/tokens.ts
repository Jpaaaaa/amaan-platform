export const color = {
  bg: '#F3F4F6',
  surface: '#FFFFFF',
  surfaceMuted: '#F9FAFB',
  text: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  border: '#E5E7EB',
  borderStrong: '#D1D5DB',
  brand: '#4F46E5',
  brandMuted: '#EEF2FF',
  brandText: '#3730A3',
  success: '#059669',
  successMuted: '#ECFDF5',
  warning: '#D97706',
  warningMuted: '#FFFBEB',
  danger: '#DC2626',
  dangerMuted: '#FEF2F2',
  overlay: 'rgba(17, 24, 39, 0.48)',
  white: '#FFFFFF',
} as const

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const

export const type = {
  display: {
    fontSize: 26,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
    color: color.text,
  },
  title: {
    fontSize: 22,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
    color: color.text,
  },
  body: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: color.text,
  },
  meta: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: color.textSecondary,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: color.textTertiary,
  },
  label: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: color.textSecondary,
  },
  section: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: color.textSecondary,
    letterSpacing: 0.3,
  },
}

export const shadow = {
  card: {
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sheet: {
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 12,
  },
}

export const hitSlop = { top: 8, bottom: 8, left: 8, right: 8 }
