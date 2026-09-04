import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { DeviceRow } from '../types'

type Props = {
  device: DeviceRow
  onPress?: (device: DeviceRow) => void
}

export function DeviceCard({ device, onPress }: Props) {
  const name = device.label?.trim() ? device.label : 'Unnamed Device'
  const active = !device.revoked

  return (
    <Pressable
      style={styles.card}
      onPress={onPress ? () => onPress(device) : undefined}
      disabled={!onPress}
    >
      <View style={styles.main}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.id} numberOfLines={1}>
          {device.machineId}
        </Text>
        <Text style={styles.status} numberOfLines={1}>
          {device.computedStatus}
        </Text>
      </View>
      <View style={[styles.badge, active ? styles.badgeActive : styles.badgeRevoked]}>
        <View style={[styles.dot, active ? styles.dotActive : styles.dotRevoked]} />
        <Text style={[styles.badgeText, active ? styles.badgeTextActive : styles.badgeTextRevoked]}>
          {active ? 'Active' : 'Revoked'}
        </Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  main: {
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  id: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#64748b',
    marginBottom: 4,
  },
  status: {
    fontSize: 11,
    color: '#94a3b8',
    textTransform: 'capitalize',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeActive: {
    backgroundColor: '#dcfce7',
  },
  badgeRevoked: {
    backgroundColor: '#fee2e2',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  dotActive: {
    backgroundColor: '#16a34a',
  },
  dotRevoked: {
    backgroundColor: '#dc2626',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  badgeTextActive: {
    color: '#15803d',
  },
  badgeTextRevoked: {
    color: '#b91c1c',
  },
})
