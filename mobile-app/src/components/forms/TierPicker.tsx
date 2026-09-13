import { View } from 'react-native'
import { IconChip } from '../ui/StatusChip'
import { DEVICE_TIER_LABELS, DEVICE_TIERS } from '../../constants/devices'

const TIER_ICONS: Record<string, string> = {
  '5d': 'flash-on',
  '15d': 'hourglass-empty',
  '1m': 'date-range',
  '2m': 'calendar-today',
  custom: 'tune',
  lifetime: 'star',
}

type Props = {
  value: string
  options?: string[]
  onChange: (tier: string) => void
}

export function TierPicker({ value, options = [...DEVICE_TIERS], onChange }: Props) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
      {options.map((t) => (
        <IconChip
          key={t}
          icon={TIER_ICONS[t] ?? 'vpn-key'}
          label={DEVICE_TIER_LABELS[t] ?? t}
          active={value === t}
          onPress={() => onChange(t)}
        />
      ))}
    </View>
  )
}
