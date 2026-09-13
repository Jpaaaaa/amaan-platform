import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import { getActivationRequests, getDevices } from '../api/client'
import { DeviceCard } from '../components/DeviceCard'
import { DeviceCreateSheet } from '../components/DeviceCreateSheet'
import { DeviceDetailSheet } from '../components/DeviceDetailSheet'
import { DeviceEditModal } from '../components/DeviceEditModal'
import { RequestsSheet } from '../components/RequestsSheet'
import { WorkspaceSwitcher } from '../components/WorkspaceSwitcher'
import { AppHeader } from '../components/ui/AppHeader'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorBanner } from '../components/ui/ErrorBanner'
import { FilterBar } from '../components/ui/FilterBar'
import { SearchField } from '../components/ui/SearchField'
import { tabBarHeight } from '../constants/layout'
import { useWorkspace } from '../context/WorkspaceContext'
import type { MainTabParamList } from '../navigation/types'
import type { DeviceRow } from '../types'
import { deviceHealth, type DeviceHealth } from '../utils/deviceDisplay'
import { color, radius, shadow } from '../theme'

type FilterKey = 'all' | DeviceHealth

type Props = {
  onUnauthorized: () => void
}

export function DevicesScreen({ onUnauthorized }: Props) {
  const insets = useSafeAreaInsets()
  const { product } = useWorkspace()
  const route = useRoute<RouteProp<MainTabParamList, 'Workspaces'>>()
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>()
  const [devices, setDevices] = useState<DeviceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<DeviceRow | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [inboxOpen, setInboxOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<FilterKey>('all')

  useEffect(() => {
    if (route.params?.filter) setFilter(route.params.filter)
  }, [route.params?.filter])

  useEffect(() => {
    if (!route.params?.create) return
    setCreateOpen(true)
    navigation.setParams({ create: undefined })
  }, [route.params?.create, navigation])

  useEffect(() => {
    if (!route.params?.inbox) return
    setInboxOpen(true)
    navigation.setParams({ inbox: undefined })
  }, [route.params?.inbox, navigation])

  const refreshPending = useCallback(async () => {
    const r = await getActivationRequests(product, 'pending')
    if (r.ok) setPendingCount(r.requests.length)
  }, [product])

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
    setSelected((prev) =>
      prev ? (r.devices.find((d) => d.machineId === prev.machineId) ?? null) : null,
    )
  }, [product, onUnauthorized])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    void refreshPending()
    const id = setInterval(() => void refreshPending(), 30_000)
    return () => clearInterval(id)
  }, [refreshPending])

  useEffect(() => {
    setSelected(null)
    setEditOpen(false)
    setSearchQuery('')
  }, [product])

  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = {
      all: devices.length,
      active: 0,
      expiring: 0,
      expired: 0,
      sync: 0,
      revoked: 0,
      unknown: 0,
    }
    for (const d of devices) c[deviceHealth(d)] += 1
    return c
  }, [devices])

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return devices.filter((d) => {
      if (filter !== 'all' && deviceHealth(d) !== filter) return false
      if (!q) return true
      return (
        (d.label ?? '').toLowerCase().includes(q) ||
        d.machineId.toLowerCase().includes(q) ||
        (d.notes ?? '').toLowerCase().includes(q)
      )
    })
  }, [devices, filter, searchQuery])

  return (
    <View style={styles.root}>
      <AppHeader
        title="Workspaces"
        subtitle={`${devices.length} licensed devices`}
      />
      <View style={styles.toolbar}>
        <WorkspaceSwitcher />
        <View style={styles.gap} />
        <Pressable
          onPress={() => setInboxOpen(true)}
          style={({ pressed }) => [styles.requestsBtn, pressed && { opacity: 0.92 }]}
          accessibilityRole="button"
          accessibilityLabel="Requests"
        >
          <View style={styles.requestsIcon}>
            <MaterialIcons name="inbox" size={18} color={color.brandText} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.requestsTitle}>Requests</Text>
            <Text style={styles.requestsMeta}>
              {pendingCount === 0
                ? 'No pending activations'
                : pendingCount === 1
                  ? '1 pending activation'
                  : `${pendingCount} pending activations`}
            </Text>
          </View>
          {pendingCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingCount}</Text>
            </View>
          ) : null}
          <MaterialIcons name="chevron-right" size={20} color={color.textTertiary} />
        </Pressable>
        <View style={styles.gap} />
        <SearchField
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search name or machine ID"
        />
        <View style={styles.gap} />
        <FilterBar
          value={filter}
          onChange={setFilter}
          options={[
            { key: 'all', label: 'All', count: counts.all },
            { key: 'active', label: 'Active', count: counts.active },
            { key: 'expiring', label: 'Expiring', count: counts.expiring },
            { key: 'expired', label: 'Expired', count: counts.expired },
            { key: 'sync', label: 'Sync', count: counts.sync },
            { key: 'revoked', label: 'Revoked', count: counts.revoked },
          ]}
        />
      </View>

      {loading && devices.length === 0 ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={color.brand} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(d) => d.machineId}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: tabBarHeight(insets.bottom) + 80,
          }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => (
            <DeviceCard device={item} onPress={(d) => setSelected(d)} />
          )}
          ListEmptyComponent={
            <EmptyState
              icon={searchQuery || filter !== 'all' ? 'search-off' : 'devices-other'}
              title={searchQuery ? 'No matches' : 'No devices'}
              body={
                searchQuery
                  ? `Nothing matches “${searchQuery}”.`
                  : 'Activate a device to get started.'
              }
            />
          }
          refreshing={loading}
          onRefresh={() => void load()}
        />
      )}

      {error ? (
        <View style={[styles.error, { bottom: tabBarHeight(insets.bottom) + 72 }]}>
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
        </View>
      ) : null}

      <Pressable
        style={[styles.fab, { bottom: tabBarHeight(insets.bottom) + 12 }]}
        onPress={() => setCreateOpen(true)}
        accessibilityLabel="Add device"
      >
        <MaterialIcons name="add" size={26} color="#fff" />
      </Pressable>

      <DeviceDetailSheet
        visible={selected != null && !editOpen}
        device={selected}
        product={product}
        onClose={() => setSelected(null)}
        onEdit={() => setEditOpen(true)}
        onChanged={() => void load()}
        onUnauthorized={onUnauthorized}
      />
      <DeviceEditModal
        visible={editOpen && selected != null}
        device={selected}
        product={product}
        onClose={() => setEditOpen(false)}
        onSaved={() => {
          setEditOpen(false)
          void load()
        }}
        onUnauthorized={onUnauthorized}
      />
      <DeviceCreateSheet
        visible={createOpen}
        product={product}
        onClose={() => setCreateOpen(false)}
        onCreated={() => void load()}
        onUnauthorized={onUnauthorized}
      />
      <RequestsSheet
        visible={inboxOpen}
        onClose={() => setInboxOpen(false)}
        onUnauthorized={onUnauthorized}
        onChanged={() => void refreshPending()}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: color.bg,
  },
  toolbar: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  gap: {
    height: 10,
  },
  requestsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 56,
    ...shadow.card,
  },
  requestsIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: color.brandMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: color.text,
  },
  requestsMeta: {
    fontSize: 12,
    color: color.textSecondary,
    marginTop: 2,
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: color.brand,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: color.white,
    fontSize: 12,
    fontWeight: '700',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
  fab: {
    position: 'absolute',
    right: 16,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: color.brand,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
})
