import { useEffect, useState } from 'react'
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { approveActivationRequest } from '../api/client'
import type { ActivationRequestRow, CustomUnit, PlatformProductKey } from '../types'
import { formatStoreType, truncateMachineId } from '../utils/requestDisplay'
import { GraceFields } from './forms/GraceFields'
import { TierPicker } from './forms/TierPicker'
import { Button } from './ui/Button'
import { ErrorBanner } from './ui/ErrorBanner'
import { IconChip } from './ui/StatusChip'
import { TextField } from './ui/TextField'
import { color, radius, shadow } from '../theme'

const CUSTOM_UNITS: CustomUnit[] = ['seconds', 'minutes', 'hours', 'days']

type Props = {
  visible: boolean
  row: ActivationRequestRow | null
  product: PlatformProductKey
  onClose: () => void
  onDone: () => void
  onUnauthorized: () => void
}

export function ApproveRequestSheet({
  visible,
  row,
  product,
  onClose,
  onDone,
  onUnauthorized,
}: Props) {
  const insets = useSafeAreaInsets()
  const [tier, setTier] = useState('1m')
  const [label, setLabel] = useState('')
  const [notes, setNotes] = useState('')
  const [customAmount, setCustomAmount] = useState('7')
  const [customUnit, setCustomUnit] = useState<CustomUnit>('days')
  const [rollingDays, setRollingDays] = useState('')
  const [rollingMinutes, setRollingMinutes] = useState('')
  const [advanced, setAdvanced] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [revokeBlocked, setRevokeBlocked] = useState<string | null>(null)

  useEffect(() => {
    if (!visible || !row) return
    setTier('1m')
    setLabel(row.store.storeName)
    setNotes('')
    setCustomAmount('7')
    setCustomUnit('days')
    setRollingDays('')
    setRollingMinutes('')
    setAdvanced(false)
    setError(null)
    setRevokeBlocked(null)
  }, [visible, row])

  async function submit(allowRevoked = false) {
    if (!row) return
    setBusy(true)
    setError(null)
    const result = await approveActivationRequest({
      product,
      machineId: row.machineId,
      tier,
      label: label.trim() || null,
      notes: notes.trim() || null,
      customAmount,
      customUnit,
      rollingDays,
      rollingMinutes,
      allowRevoked,
    })
    setBusy(false)
    if (!result.ok) {
      if (result.unauthorized) {
        onUnauthorized()
        return
      }
      if (result.errorCode === 'DEVICE_REVOKED') {
        setRevokeBlocked(result.error)
        return
      }
      setError(result.error)
      return
    }
    onDone()
    onClose()
  }

  const store = row?.store
  const meta = [
    store?.phone?.trim(),
    store?.city?.trim(),
    formatStoreType(store?.storeType ?? null, store?.storeTypeOther ?? null),
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <Modal visible={visible && row != null} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.card, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>Approve activation</Text>
          {store ? (
            <>
              <Text style={styles.store}>{store.storeName || 'Unnamed store'}</Text>
              {meta ? <Text style={styles.meta}>{meta}</Text> : null}
              <Text style={styles.machine}>{truncateMachineId(row?.machineId ?? '')}</Text>
            </>
          ) : null}

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.scroll}
          >
            <TextField
              label="Device label"
              value={label}
              onChangeText={setLabel}
              placeholder="Store label"
            />
            <Text style={styles.fieldLabel}>License</Text>
            <TierPicker value={tier} onChange={setTier} />
            {tier === 'custom' ? (
              <>
                <TextField
                  label="Custom duration"
                  value={customAmount}
                  onChangeText={setCustomAmount}
                  keyboardType="numeric"
                />
                <View style={styles.unitRow}>
                  {CUSTOM_UNITS.map((u) => (
                    <IconChip
                      key={u}
                      icon="schedule"
                      label={u}
                      active={customUnit === u}
                      onPress={() => setCustomUnit(u)}
                    />
                  ))}
                </View>
              </>
            ) : null}

            <Pressable onPress={() => setAdvanced((v) => !v)} style={styles.advancedToggle}>
              <Text style={styles.advancedText}>
                {advanced ? 'Hide advanced' : 'Notes and offline window'}
              </Text>
            </Pressable>
            {advanced ? (
              <>
                <TextField
                  label="Notes"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  placeholder="Optional"
                  style={{ minHeight: 72, textAlignVertical: 'top' }}
                />
                <GraceFields
                  days={rollingDays}
                  minutes={rollingMinutes}
                  onDays={setRollingDays}
                  onMinutes={setRollingMinutes}
                />
              </>
            ) : null}

            {revokeBlocked ? (
              <View style={styles.warn}>
                <Text style={styles.warnText}>{revokeBlocked}</Text>
                <Button
                  title="Approve and restore access"
                  onPress={() => void submit(true)}
                  loading={busy}
                  disabled={busy}
                />
              </View>
            ) : null}
            {error ? <ErrorBanner message={error} /> : null}
          </ScrollView>

          {!revokeBlocked ? (
            <View style={styles.actions}>
              <Button title="Cancel" variant="secondary" onPress={onClose} style={styles.flex} />
              <Button
                title="Approve"
                onPress={() => void submit(false)}
                loading={busy}
                disabled={busy}
                style={styles.flexGrow}
              />
            </View>
          ) : null}
        </View>
      </KeyboardAvoidingView>
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
    maxHeight: '92%',
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
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: color.text,
  },
  store: {
    fontSize: 16,
    fontWeight: '600',
    color: color.text,
    marginTop: 6,
  },
  meta: {
    fontSize: 13,
    color: color.textSecondary,
    marginTop: 2,
  },
  machine: {
    fontSize: 12,
    color: color.brand,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  scroll: {
    maxHeight: 420,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: color.textSecondary,
    marginBottom: 8,
  },
  unitRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  advancedToggle: {
    paddingVertical: 8,
    marginBottom: 8,
  },
  advancedText: {
    fontSize: 13,
    fontWeight: '600',
    color: color.brand,
  },
  warn: {
    backgroundColor: color.warningMuted,
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: radius.md,
    padding: 12,
    gap: 10,
    marginBottom: 12,
  },
  warnText: {
    color: '#92400E',
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  flex: { flex: 1 },
  flexGrow: { flex: 1.4 },
})
