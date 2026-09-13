import { Pressable, StyleSheet, Text, View } from 'react-native'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import { color, radius } from '../../theme'

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'brand'

const TONES: Record<Tone, { bg: string; fg: string; border: string }> = {
  neutral: { bg: color.surfaceMuted, fg: color.textSecondary, border: color.border },
  success: { bg: color.successMuted, fg: color.success, border: '#A7F3D0' },
  warning: { bg: color.warningMuted, fg: color.warning, border: '#FDE68A' },
  danger: { bg: color.dangerMuted, fg: color.danger, border: '#FECACA' },
  brand: { bg: color.brandMuted, fg: color.brandText, border: '#C7D2FE' },
}

type Props = {
  label: string
  tone?: Tone
  dot?: boolean
}

export function StatusChip({ label, tone = 'neutral', dot }: Props) {
  const t = TONES[tone]
  return (
    <View style={[styles.chip, { backgroundColor: t.bg, borderColor: t.border }]}>
      {dot ? <View style={[styles.dot, { backgroundColor: t.fg }]} /> : null}
      <Text style={[styles.text, { color: t.fg }]}>{label}</Text>
    </View>
  )
}

export function CountChip({
  label,
  active,
  count,
  onPress,
}: {
  label: string
  active: boolean
  count?: number
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.filter, active && styles.filterActive]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
      {count != null ? (
        <Text style={[styles.filterCount, active && styles.filterTextActive]}>{count}</Text>
      ) : null}
    </Pressable>
  )
}

export function IconChip({
  icon,
  label,
  active,
  onPress,
}: {
  icon: string
  label: string
  active: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.iconChip, active && styles.iconChipActive]}
    >
      <MaterialIcons
        name={icon}
        size={14}
        color={active ? color.brand : color.textSecondary}
        style={{ marginRight: 4 }}
      />
      <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
  filter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    minHeight: 36,
  },
  filterActive: {
    backgroundColor: color.brandMuted,
    borderColor: '#C7D2FE',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: color.textSecondary,
  },
  filterTextActive: {
    color: color.brandText,
  },
  filterCount: {
    fontSize: 12,
    fontWeight: '700',
    color: color.textTertiary,
  },
  iconChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: color.surfaceMuted,
    borderWidth: 1,
    borderColor: color.border,
    minHeight: 40,
  },
  iconChipActive: {
    backgroundColor: color.brandMuted,
    borderColor: '#C7D2FE',
  },
})
