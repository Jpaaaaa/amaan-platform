import { Pressable, StyleSheet, Text, View } from 'react-native'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import type { DeviceRow } from '../types'
import {
  deviceDisplayName,
  deviceHealth,
  deviceMetaLine,
  healthLabel,
  lastSyncLine,
  type DeviceHealth,
} from '../utils/deviceDisplay'
import { StatusChip } from './ui/StatusChip'
import { color, radius, shadow } from '../theme'

const TONE: Record<DeviceHealth, 'success' | 'warning' | 'danger' | 'neutral' | 'brand'> = {
  active: 'success',
  expiring: 'warning',
  expired: 'danger',
  sync: 'warning',
  revoked: 'danger',
  unknown: 'neutral',
}

type Props = {
  device: DeviceRow
  onPress?: (device: DeviceRow) => void
}

export function DeviceCard({ device, onPress }: Props) {
  const health = deviceHealth(device)
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress ? () => onPress(device) : undefined}
      disabled={!onPress}
    >
      <View style={styles.top}>
        <Text style={styles.name} numberOfLines={1}>
          {deviceDisplayName(device)}
        </Text>
        <StatusChip label={healthLabel(health)} tone={TONE[health]} dot />
      </View>
      <Text style={styles.meta} numberOfLines={1}>
        {deviceMetaLine(device)}
      </Text>
      <View style={styles.bottom}>
        <Text style={styles.sync}>{lastSyncLine(device)}</Text>
        <MaterialIcons name="chevron-right" size={18} color={color.textTertiary} />
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.surface,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: color.border,
    ...shadow.card,
  },
  pressed: {
    backgroundColor: color.surfaceMuted,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: color.text,
    letterSpacing: -0.2,
  },
  meta: {
    fontSize: 13,
    color: color.textSecondary,
    fontWeight: '500',
  },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  sync: {
    fontSize: 12,
    color: color.textTertiary,
    fontWeight: '500',
  },
})
