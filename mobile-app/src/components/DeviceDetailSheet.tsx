import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import { deleteDevice, revokeDevice } from '../api/client'
import { Button } from './ui/Button'
import { ErrorBanner } from './ui/ErrorBanner'
import { StatusChip } from './ui/StatusChip'
import {
  deviceDisplayName,
  deviceHealth,
  fmtDeviceDate,
  healthLabel,
  lastSyncLine,
  statusLabel,
  tierLabel,
  type DeviceHealth,
} from '../utils/deviceDisplay'
import { formatOfflineGraceMs } from '../utils/offlineGrace'
import type { DeviceRow, PlatformProductKey } from '../types'
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
  visible: boolean
  device: DeviceRow | null
  product: PlatformProductKey
  onClose: () => void
  onEdit: () => void
  onChanged: () => void
  onUnauthorized: () => void
}

function Fact({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={[styles.factValue, mono && styles.mono]} selectable>
        {value}
      </Text>
    </View>
  )
}

export function DeviceDetailSheet({
  visible,
  device,
  product,
  onClose,
  onEdit,
  onChanged,
  onUnauthorized,
}: Props) {
  const insets = useSafeAreaInsets()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onRevoke() {
    if (!device) return
    setBusy(true)
    setError(null)
    const r = await revokeDevice(product, device.machineId, !device.revoked)
    setBusy(false)
    if (!r.ok) {
      if (r.unauthorized) {
        onUnauthorized()
        return
      }
      setError(r.error)
      return
    }
    onChanged()
  }

  function onDeletePress() {
    if (!device) return
    Alert.alert(
      'Delete this device?',
      `Remove ${deviceDisplayName(device)}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => void confirmDelete() },
      ],
    )
  }

  async function confirmDelete() {
    if (!device) return
    setBusy(true)
    setError(null)
    const r = await deleteDevice(product, device.machineId)
    setBusy(false)
    if (!r.ok) {
      if (r.unauthorized) {
        onUnauthorized()
        return
      }
      setError(r.error)
      return
    }
    onClose()
    onChanged()
  }

  const health = device ? deviceHealth(device) : 'unknown'

  return (
    <Modal visible={visible && device != null} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.card, { paddingBottom: insets.bottom + 16 }]} onPress={() => {}}>
          <View style={styles.handle} />
          {device ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.hero}>
                <View style={styles.heroText}>
                  <Text style={styles.title}>{deviceDisplayName(device)}</Text>
                  <Text style={styles.subtitle}>{tierLabel(device.tier)}</Text>
                </View>
                <StatusChip label={healthLabel(health)} tone={TONE[health]} dot />
              </View>

              <Fact label="Machine ID" value={device.machineId} mono />
              <Fact label="Expires" value={fmtDeviceDate(device.expiresAtMs)} />
              <Fact label="Last sync" value={lastSyncLine(device)} />
              <Fact
                label="Status"
                value={statusLabel(device.computedStatus, device.revoked)}
              />
              <Fact label="Offline window" value={formatOfflineGraceMs(device.rollingMaxMs)} />
              {device.notes?.trim() ? <Fact label="Notes" value={device.notes.trim()} /> : null}

              {error ? (
                <View style={{ marginTop: 8 }}>
                  <ErrorBanner message={error} />
                </View>
              ) : null}

              <View style={styles.actions}>
                <Button title="Edit" onPress={onEdit} disabled={busy} style={styles.flex} />
                <Button
                  title={device.revoked ? 'Restore' : 'Revoke'}
                  variant={device.revoked ? 'secondary' : 'danger'}
                  onPress={() => void onRevoke()}
                  disabled={busy}
                  style={styles.flex}
                />
              </View>
              {busy ? (
                <ActivityIndicator color={color.brand} style={{ marginTop: 12 }} />
              ) : (
                <Pressable onPress={onDeletePress} style={styles.delete}>
                  <MaterialIcons name="delete-outline" size={16} color={color.danger} />
                  <Text style={styles.deleteText}>Delete device</Text>
                </Pressable>
              )}
            </ScrollView>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: color.overlay,
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: color.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '90%',
    ...shadow.sheet,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: color.borderStrong,
    marginBottom: 16,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  heroText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: color.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: color.textSecondary,
    marginTop: 4,
  },
  fact: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.border,
  },
  factLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: color.textTertiary,
    marginBottom: 4,
  },
  factValue: {
    fontSize: 15,
    fontWeight: '500',
    color: color.text,
  },
  mono: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  flex: { flex: 1 },
  delete: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
  },
  deleteText: {
    color: color.danger,
    fontSize: 14,
    fontWeight: '600',
  },
})
