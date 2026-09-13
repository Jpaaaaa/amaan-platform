import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import {
  declineActivationRequest,
  deleteActivationRequest,
  getActivationRequests,
} from '../api/client'
import { ApproveRequestSheet } from './ApproveRequestSheet'
import { Button } from './ui/Button'
import { EmptyState } from './ui/EmptyState'
import { ErrorBanner } from './ui/ErrorBanner'
import { FilterBar } from './ui/FilterBar'
import { StatusChip } from './ui/StatusChip'
import { TextField } from './ui/TextField'
import { PRODUCT_META } from '../constants/products'
import { useWorkspace } from '../context/WorkspaceContext'
import type { InboxStatus } from '../navigation/types'
import type { ActivationRequestRow } from '../types'
import {
  formatRelativeAge,
  formatStoreType,
  truncateMachineId,
} from '../utils/requestDisplay'
import { color, radius, shadow } from '../theme'

const POLL_MS = 30_000

type Props = {
  visible: boolean
  onClose: () => void
  onUnauthorized: () => void
  onChanged?: () => void
}

export function RequestsSheet({ visible, onClose, onUnauthorized, onChanged }: Props) {
  const insets = useSafeAreaInsets()
  const { product } = useWorkspace()
  const [status, setStatus] = useState<InboxStatus>('pending')
  const [requests, setRequests] = useState<ActivationRequestRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [approveRow, setApproveRow] = useState<ActivationRequestRow | null>(null)
  const [declineRow, setDeclineRow] = useState<ActivationRequestRow | null>(null)
  const [declineReason, setDeclineReason] = useState('')

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true)
      setError(null)
      const r = await getActivationRequests(product, status)
      if (!silent) setLoading(false)
      if (!r.ok) {
        if (r.unauthorized) {
          onUnauthorized()
          return
        }
        setError(r.error)
        setRequests([])
        return
      }
      setRequests(r.requests)
    },
    [product, status, onUnauthorized],
  )

  useEffect(() => {
    if (!visible) return
    setStatus('pending')
  }, [visible])

  useEffect(() => {
    if (!visible) return
    void load()
    const id = setInterval(() => void load(true), POLL_MS)
    return () => clearInterval(id)
  }, [visible, load])

  async function afterChange() {
    await load()
    onChanged?.()
  }

  async function handleDecline(row: ActivationRequestRow, reason: string) {
    setError(null)
    setBusyId(row.machineId)
    const result = await declineActivationRequest(product, row.machineId, reason.trim() || null)
    setBusyId(null)
    if (!result.ok) {
      if (result.unauthorized) onUnauthorized()
      else setError(result.error)
      return
    }
    setDeclineRow(null)
    setDeclineReason('')
    await afterChange()
  }

  function confirmDelete(row: ActivationRequestRow) {
    Alert.alert('Delete this request?', row.store.storeName || row.machineId, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void handleDelete(row) },
    ])
  }

  async function handleDelete(row: ActivationRequestRow) {
    setError(null)
    setBusyId(row.machineId)
    const result = await deleteActivationRequest(product, row.machineId)
    setBusyId(null)
    if (!result.ok) {
      if (result.unauthorized) onUnauthorized()
      else setError(result.error)
      return
    }
    await afterChange()
  }

  function renderRow({ item: row }: { item: ActivationRequestRow }) {
    const { store } = row
    const metaParts: string[] = []
    if (store.phone?.trim()) metaParts.push(store.phone.trim())
    if (store.city?.trim()) metaParts.push(store.city.trim())
    const typeLabel = formatStoreType(store.storeType, store.storeTypeOther)
    if (typeLabel) metaParts.push(typeLabel)
    const busy = busyId === row.machineId

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <Text style={styles.storeName} numberOfLines={2}>
            {store.storeName || 'Unnamed store'}
          </Text>
          {row.status === 'declined' ? (
            <StatusChip label="Declined" tone="danger" />
          ) : row.status === 'approved' ? (
            <StatusChip label="Approved" tone="success" />
          ) : (
            <StatusChip label={formatRelativeAge(row.updatedAtMs)} tone="brand" />
          )}
        </View>
        {metaParts.length > 0 ? <Text style={styles.meta}>{metaParts.join(' · ')}</Text> : null}
        {store.ownerContactName?.trim() ? (
          <Text style={styles.meta}>{store.ownerContactName.trim()}</Text>
        ) : null}
        <Text style={styles.machine}>{truncateMachineId(row.machineId)}</Text>
        {row.status === 'declined' && row.declineReason?.trim() ? (
          <Text style={styles.reason}>{row.declineReason.trim()}</Text>
        ) : null}

        {row.status === 'pending' ? (
          <View style={styles.actions}>
            <Button
              title="Approve"
              compact
              onPress={() => setApproveRow(row)}
              disabled={busy}
              style={styles.actionGrow}
            />
            <Button
              title="Decline"
              compact
              variant="secondary"
              onPress={() => {
                setDeclineReason('')
                setDeclineRow(row)
              }}
              disabled={busy}
              style={styles.action}
            />
            <Pressable onPress={() => confirmDelete(row)} hitSlop={8} style={styles.more}>
              <Text style={styles.moreText}>Delete</Text>
            </Pressable>
          </View>
        ) : row.status === 'declined' ? (
          <Pressable onPress={() => confirmDelete(row)} hitSlop={8} style={styles.more}>
            <Text style={styles.moreText}>Delete</Text>
          </Pressable>
        ) : null}
      </View>
    )
  }

  const emptyTitle =
    status === 'pending'
      ? 'No pending requests'
      : status === 'declined'
        ? 'No declined requests'
        : 'No history yet'

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.dismiss} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 8 }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Requests</Text>
              <Text style={styles.subtitle}>{PRODUCT_META[product].label}</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8} accessibilityLabel="Close">
              <MaterialIcons name="close" size={22} color={color.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.filters}>
            <FilterBar
              value={status}
              onChange={setStatus}
              options={[
                { key: 'pending', label: 'Pending' },
                { key: 'declined', label: 'Declined' },
                { key: 'approved', label: 'History' },
              ]}
            />
          </View>

          {loading && requests.length === 0 ? (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color={color.brand} />
            </View>
          ) : (
            <FlatList
              data={requests}
              keyExtractor={(r) => r.machineId}
              renderItem={renderRow}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.list}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
              refreshing={loading}
              onRefresh={() => void load()}
              ListEmptyComponent={
                <EmptyState compact icon="inbox" title={emptyTitle} body="Pull to refresh." />
              }
            />
          )}

          {error ? (
            <View style={styles.error}>
              <ErrorBanner message={error} onDismiss={() => setError(null)} />
            </View>
          ) : null}
        </View>
      </View>

      <ApproveRequestSheet
        visible={approveRow != null}
        row={approveRow}
        product={product}
        onClose={() => setApproveRow(null)}
        onDone={() => void afterChange()}
        onUnauthorized={onUnauthorized}
      />

      <Modal visible={declineRow != null} animationType="fade" transparent>
        <KeyboardAvoidingView
          style={styles.declineBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setDeclineRow(null)} />
          <View style={styles.declineCard}>
            <Text style={styles.declineTitle}>Decline request</Text>
            <Text style={styles.declineHint}>Reason is optional and stored on the request.</Text>
            <TextField
              value={declineReason}
              onChangeText={setDeclineReason}
              placeholder="Reason"
            />
            <View style={styles.declineActions}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setDeclineRow(null)}
                style={{ flex: 1 }}
              />
              <Button
                title="Decline"
                variant="dangerSolid"
                onPress={() => {
                  if (declineRow) void handleDecline(declineRow, declineReason)
                }}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: color.overlay,
    justifyContent: 'flex-end',
  },
  dismiss: {
    flex: 1,
  },
  sheet: {
    backgroundColor: color.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '92%',
    minHeight: '72%',
    ...shadow.sheet,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: color.borderStrong,
    marginTop: 10,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: color.text,
  },
  subtitle: {
    fontSize: 13,
    color: color.textSecondary,
    marginTop: 2,
  },
  filters: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 180,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  error: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  card: {
    backgroundColor: color.surface,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: color.border,
    ...shadow.card,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  storeName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: color.text,
  },
  meta: {
    fontSize: 13,
    color: color.textSecondary,
    marginBottom: 2,
  },
  machine: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    color: color.brand,
    fontWeight: '600',
    marginTop: 6,
    marginBottom: 10,
  },
  reason: {
    backgroundColor: color.dangerMuted,
    color: '#991B1B',
    fontSize: 13,
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionGrow: { flex: 1.3 },
  action: { flex: 1 },
  more: {
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  moreText: {
    color: color.textTertiary,
    fontSize: 13,
    fontWeight: '600',
  },
  declineBackdrop: {
    flex: 1,
    backgroundColor: color.overlay,
    justifyContent: 'center',
    padding: 24,
  },
  declineCard: {
    backgroundColor: color.surface,
    borderRadius: 16,
    padding: 20,
  },
  declineTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: color.text,
    marginBottom: 4,
  },
  declineHint: {
    fontSize: 13,
    color: color.textSecondary,
    marginBottom: 12,
  },
  declineActions: {
    flexDirection: 'row',
    gap: 10,
  },
})
