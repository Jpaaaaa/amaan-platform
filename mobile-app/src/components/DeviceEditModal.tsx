import { useEffect, useState } from 'react'
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import { updateDevice } from '../api/client'
import { DEVICE_TIERS } from '../constants/devices'
import {
  computeExpiryFromTier,
  formatDatetimeInput,
  parseDatetimeInput,
} from '../lib/device-form'
import { msToOfflineDaysMinutes, parseOfflineGraceMs } from '../utils/offlineGrace'
import type { DeviceRow, PlatformProductKey } from '../types'
import { GraceFields } from './forms/GraceFields'
import { TierPicker } from './forms/TierPicker'
import { Button } from './ui/Button'
import { ErrorBanner } from './ui/ErrorBanner'
import { TextField } from './ui/TextField'
import { color, hitSlop, radius } from '../theme'

type Props = {
  visible: boolean
  device: DeviceRow | null
  product: PlatformProductKey
  onClose: () => void
  onSaved: () => void
  onUnauthorized: () => void
}

function tierOptions(current: string): string[] {
  const base: string[] = [...DEVICE_TIERS]
  if (current && !base.includes(current)) base.push(current)
  return base
}

export function DeviceEditModal({
  visible,
  device,
  product,
  onClose,
  onSaved,
  onUnauthorized,
}: Props) {
  const insets = useSafeAreaInsets()
  const [label, setLabel] = useState('')
  const [notes, setNotes] = useState('')
  const [tier, setTier] = useState('1m')
  const [expires, setExpires] = useState('')
  const [lastSync, setLastSync] = useState('')
  const [rollingDays, setRollingDays] = useState('')
  const [rollingMinutes, setRollingMinutes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!device || !visible) return
    setLabel(device.label ?? '')
    setNotes(device.notes ?? '')
    setTier(device.tier)
    setExpires(
      device.tier === 'lifetime' || device.expiresAtMs == null
        ? ''
        : formatDatetimeInput(device.expiresAtMs),
    )
    setLastSync(formatDatetimeInput(device.lastSyncAtMs ?? device.createdAtMs))
    const { days, minutes } = msToOfflineDaysMinutes(device.rollingMaxMs)
    setRollingDays(days)
    setRollingMinutes(minutes)
    setError(null)
  }, [device, visible])

  function applyTier(nextTier: string) {
    setTier(nextTier)
    if (nextTier === 'lifetime') {
      setExpires('')
      return
    }
    const ms = computeExpiryFromTier(Date.now(), nextTier)
    if (ms != null) setExpires(formatDatetimeInput(ms))
  }

  async function onSave() {
    if (!device) return
    const expiresAtMs = tier === 'lifetime' ? null : parseDatetimeInput(expires)
    if (tier !== 'lifetime' && expiresAtMs == null) {
      setError('Set expiry date (YYYY-MM-DD HH:mm) or choose Lifetime.')
      return
    }
    const lastSyncTrim = lastSync.trim()
    const lastSyncAtMs = lastSyncTrim ? parseDatetimeInput(lastSyncTrim) : null
    if (lastSyncTrim && lastSyncAtMs == null) {
      setError('Invalid last sync date. Use YYYY-MM-DD HH:mm.')
      return
    }
    const rollingParsed = parseOfflineGraceMs(rollingDays, rollingMinutes)
    if (rollingParsed === 'err') {
      setError('Offline window: use whole numbers (days and minutes ≥ 0).')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const r = await updateDevice({
        product,
        machineId: device.machineId,
        label: label.trim() || null,
        notes: notes.trim() || null,
        tier,
        expiresAtMs,
        lastSyncAtMs,
        rollingMaxMs: rollingParsed,
      })
      if (!r.ok) {
        if (r.unauthorized) {
          onUnauthorized()
          return
        }
        setError(r.error)
        return
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  const tiers = device ? tierOptions(device.tier) : []

  return (
    <Modal visible={visible && device != null} animationType="slide" onRequestClose={onClose}>
      {device ? (
        <View style={[styles.root, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <Pressable onPress={onClose} disabled={saving} hitSlop={hitSlop} accessibilityLabel="Close">
              <MaterialIcons name="close" size={22} color={color.textSecondary} />
            </Pressable>
            <Text style={styles.headerTitle}>Edit device</Text>
            <View style={{ width: 22 }} />
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Machine ID</Text>
              <Text style={styles.infoValue} selectable>
                {device.machineId}
              </Text>
            </View>

            <Text style={styles.section}>Identity</Text>
            <TextField
              label="Device label"
              value={label}
              onChangeText={setLabel}
              placeholder="Front desk register"
            />

            <Text style={styles.section}>License</Text>
            <TierPicker value={tier} options={tiers} onChange={applyTier} />
            <TextField
              label="Expires"
              value={expires}
              onChangeText={setExpires}
              editable={tier !== 'lifetime'}
              placeholder={
                tier === 'lifetime' ? 'Not applicable for lifetime' : 'YYYY-MM-DD HH:mm'
              }
              autoCapitalize="none"
              autoCorrect={false}
              hint="Changing a preset fills a new expiry from now."
            />
            <TextField
              label="Last sync"
              value={lastSync}
              onChangeText={setLastSync}
              placeholder="YYYY-MM-DD HH:mm"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.section}>Notes</Text>
            <TextField
              label="Private comments"
              value={notes}
              onChangeText={setNotes}
              multiline
              placeholder="Optional"
              style={{ minHeight: 88, textAlignVertical: 'top' }}
            />

            <Text style={styles.section}>Offline window</Text>
            <GraceFields
              days={rollingDays}
              minutes={rollingMinutes}
              onDays={setRollingDays}
              onMinutes={setRollingMinutes}
            />

            {error ? <ErrorBanner message={error} /> : null}
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
            <Button title="Cancel" variant="secondary" onPress={onClose} disabled={saving} style={styles.flex} />
            <Button
              title="Save"
              onPress={() => void onSave()}
              loading={saving}
              disabled={saving}
              style={styles.flexGrow}
            />
          </View>
        </View>
      ) : null}
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: color.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.border,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: color.text,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  infoCard: {
    backgroundColor: color.surface,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: color.border,
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: color.textTertiary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: color.text,
    fontFamily: 'monospace',
  },
  section: {
    fontSize: 12,
    fontWeight: '600',
    color: color.textSecondary,
    marginBottom: 10,
    marginTop: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: color.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color.border,
    flexDirection: 'row',
    gap: 10,
  },
  flex: { flex: 1 },
  flexGrow: { flex: 1.4 },
})
