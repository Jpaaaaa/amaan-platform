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
import { createDevice } from '../api/client'
import { GraceFields } from './forms/GraceFields'
import { TierPicker } from './forms/TierPicker'
import { Button } from './ui/Button'
import { ErrorBanner } from './ui/ErrorBanner'
import { TextField } from './ui/TextField'
import { color, radius, shadow } from '../theme'
import type { CustomUnit, PlatformProductKey } from '../types'
import { IconChip } from './ui/StatusChip'

const CUSTOM_UNITS: CustomUnit[] = ['seconds', 'minutes', 'hours', 'days']

type Props = {
  visible: boolean
  product: PlatformProductKey
  onClose: () => void
  onCreated: () => void
  onUnauthorized: () => void
}

export function DeviceCreateSheet({
  visible,
  product,
  onClose,
  onCreated,
  onUnauthorized,
}: Props) {
  const insets = useSafeAreaInsets()
  const [machineId, setMachineId] = useState('')
  const [label, setLabel] = useState('')
  const [tier, setTier] = useState('1m')
  const [notes, setNotes] = useState('')
  const [customAmount, setCustomAmount] = useState('7')
  const [customUnit, setCustomUnit] = useState<CustomUnit>('days')
  const [rollingDays, setRollingDays] = useState('')
  const [rollingMinutes, setRollingMinutes] = useState('')
  const [advanced, setAdvanced] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!visible) return
    setMachineId('')
    setLabel('')
    setTier('1m')
    setNotes('')
    setCustomAmount('7')
    setCustomUnit('days')
    setRollingDays('')
    setRollingMinutes('')
    setAdvanced(false)
    setError(null)
  }, [visible])

  async function onCreate() {
    if (!machineId.trim()) {
      setError('Machine ID is required.')
      return
    }
    setSaving(true)
    setError(null)
    const r = await createDevice({
      product,
      machineId: machineId.trim(),
      label: label.trim() || null,
      tier,
      renew: true,
      notes: notes.trim() || null,
      customAmount,
      customUnit,
      rollingDays,
      rollingMinutes,
    })
    setSaving(false)
    if (!r.ok) {
      if (r.unauthorized) {
        onUnauthorized()
        return
      }
      setError(r.error)
      return
    }
    onCreated()
    onClose()
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.card, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>Add device</Text>
          <Text style={styles.subtitle}>Activate a license on this workspace.</Text>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.scroll}
          >
            <TextField
              label="Machine ID"
              value={machineId}
              onChangeText={setMachineId}
              autoCapitalize="none"
              placeholder="DEVICE-001"
            />
            <TextField
              label="Label"
              value={label}
              onChangeText={setLabel}
              placeholder="Front counter"
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
                  placeholder="Amount"
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
            {error ? <ErrorBanner message={error} /> : null}
          </ScrollView>
          <View style={styles.actions}>
            <Button title="Cancel" variant="secondary" onPress={onClose} style={styles.flex} />
            <Button
              title="Activate"
              onPress={() => void onCreate()}
              loading={saving}
              disabled={saving}
              style={styles.flexGrow}
            />
          </View>
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
  subtitle: {
    fontSize: 13,
    color: color.textSecondary,
    marginBottom: 16,
    marginTop: 4,
  },
  scroll: {
    maxHeight: 440,
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
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  flex: {
    flex: 1,
  },
  flexGrow: {
    flex: 1.4,
  },
})
