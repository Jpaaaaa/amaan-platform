import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { createDevice, getDevices, revokeDevice } from '../api/client'
import { DeviceCard } from '../components/DeviceCard'
import { ProductSwitcher } from '../components/ProductSwitcher'
import type { DeviceRow, PlatformProductKey } from '../types'
import { PLATFORM_PRODUCT_BAZAR } from '../types'

type Props = {
  onUnauthorized: () => void
}

const TIERS = ['5d', '15d', '1m', '2m', 'lifetime'] as const

export function DevicesScreen({ onUnauthorized }: Props) {
  const [product, setProduct] = useState<PlatformProductKey>(PLATFORM_PRODUCT_BAZAR)
  const [devices, setDevices] = useState<DeviceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [machineId, setMachineId] = useState('')
  const [label, setLabel] = useState('')
  const [tier, setTier] = useState<string>('1m')
  const [saving, setSaving] = useState(false)
  const [detail, setDetail] = useState<DeviceRow | null>(null)
  const [revoking, setRevoking] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const r = await getDevices(product)
    setLoading(false)
    if (!r.ok) {
      if (r.unauthorized) {
        onUnauthorized()
        return
      }
      setError(r.error)
      return
    }
    setDevices(r.devices)
  }, [product, onUnauthorized])

  useEffect(() => {
    void load()
  }, [load])

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
      renew: false,
      notes: null,
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
    setModalOpen(false)
    setMachineId('')
    setLabel('')
    setTier('1m')
    void load()
  }

  function confirmToggleRevoke(device: DeviceRow) {
    const nextRevoked = !device.revoked
    Alert.alert(
      nextRevoked ? 'Revoke device?' : 'Restore device?',
      device.machineId,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: nextRevoked ? 'Revoke' : 'Restore',
          style: nextRevoked ? 'destructive' : 'default',
          onPress: () => void onToggleRevoke(device, nextRevoked),
        },
      ],
    )
  }

  async function onToggleRevoke(device: DeviceRow, nextRevoked: boolean) {
    setRevoking(true)
    setError(null)
    const r = await revokeDevice(product, device.machineId, nextRevoked)
    setRevoking(false)
    if (!r.ok) {
      if (r.unauthorized) {
        onUnauthorized()
        return
      }
      setError(r.error)
      return
    }
    setDetail(null)
    void load()
  }

  return (
    <View style={styles.root}>
      <ProductSwitcher value={product} onChange={setProduct} />

      {loading ? (
        <ActivityIndicator style={styles.loader} color="#0a6cff" />
      ) : (
        <FlatList
          data={devices}
          keyExtractor={(d) => d.machineId}
          renderItem={({ item }) => (
            <DeviceCard
              device={item}
              onPress={(d) => {
                setError(null)
                setDetail(d)
              }}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No devices registered for this product.</Text>
          }
          refreshing={loading}
          onRefresh={() => void load()}
        />
      )}

      {error && !detail ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.fab} onPress={() => setModalOpen(true)}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      <Modal visible={detail != null} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Device</Text>
            {detail ? (
              <>
                <Text style={styles.detailName}>
                  {detail.label?.trim() ? detail.label : 'Unnamed Device'}
                </Text>
                <Text style={styles.detailId}>{detail.machineId}</Text>
                <Text style={styles.detailMeta}>
                  {detail.tier} · {detail.computedStatus}
                  {detail.revoked ? ' · revoked' : ''}
                </Text>
              </>
            ) : null}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setDetail(null)}>
                <Text style={styles.cancelText}>Close</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.saveBtn,
                  detail?.revoked ? styles.restoreBtn : styles.revokeBtn,
                  revoking && styles.saveBtnDisabled,
                ]}
                onPress={() => {
                  if (detail) confirmToggleRevoke(detail)
                }}
                disabled={revoking || !detail}
              >
                {revoking ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveText}>
                    {detail?.revoked ? 'Restore' : 'Revoke'}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add device</Text>

            <Text style={styles.fieldLabel}>Machine ID</Text>
            <TextInput
              style={styles.input}
              value={machineId}
              onChangeText={setMachineId}
              autoCapitalize="none"
              placeholder="DEVICE-001"
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.fieldLabel}>Label (optional)</Text>
            <TextInput
              style={styles.input}
              value={label}
              onChangeText={setLabel}
              placeholder="Front counter"
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.fieldLabel}>Tier</Text>
            <View style={styles.tierRow}>
              {TIERS.map((t) => (
                <Pressable
                  key={t}
                  style={[styles.tierChip, tier === t && styles.tierChipActive]}
                  onPress={() => setTier(t)}
                >
                  <Text style={[styles.tierText, tier === t && styles.tierTextActive]}>{t}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setModalOpen(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={() => void onCreate()}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveText}>Create</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8fafc',
  },
  loader: {
    marginTop: 32,
  },
  empty: {
    textAlign: 'center',
    color: '#64748b',
    marginTop: 24,
    fontSize: 14,
  },
  error: {
    color: '#dc2626',
    marginTop: 8,
    fontSize: 13,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0a6cff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  fabText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '300',
    marginTop: -2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
    color: '#0f172a',
  },
  detailName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  detailId: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#64748b',
    marginBottom: 6,
  },
  detailMeta: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 16,
    textTransform: 'capitalize',
  },
  revokeBtn: {
    backgroundColor: '#dc2626',
  },
  restoreBtn: {
    backgroundColor: '#15803d',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 15,
    color: '#0f172a',
  },
  tierRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  tierChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  tierChipActive: {
    backgroundColor: '#dbeafe',
  },
  tierText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  tierTextActive: {
    color: '#0a6cff',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  cancelText: {
    color: '#475569',
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#0a6cff',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveText: {
    color: '#fff',
    fontWeight: '700',
  },
})
