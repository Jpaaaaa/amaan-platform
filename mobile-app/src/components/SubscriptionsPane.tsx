import { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  approveAmanatSubscription,
  deleteAmanatAccount,
  fetchAmanatSubscriptions,
  rejectAmanatSubscription,
  suspendAmanatAccount,
  unlockAmanatAccount,
  type SubscriptionListItem,
} from '../api/amanat'
import { tabBarHeight } from '../constants/layout'
import {
  filterSubscriptions,
  subscriptionIsActiveApproved,
  type SubscriptionFilter,
} from '../lib/subscription-status'
import { color, hitSlop } from '../theme'
import { AccountDetailSheet } from './AccountDetailSheet'
import { ApproveSubscriptionSheet } from './ApproveSubscriptionSheet'
import { SubscriptionCard } from './SubscriptionCard'
import { EmptyState } from './ui/EmptyState'
import { ErrorBanner } from './ui/ErrorBanner'
import { FilterBar } from './ui/FilterBar'
import { SearchField } from './ui/SearchField'

type Props = {
  intentFilter?: SubscriptionFilter
  onUnauthorized: () => void
  onSignOut: () => void
}

export function SubscriptionsPane({ intentFilter, onUnauthorized, onSignOut }: Props) {
  const insets = useSafeAreaInsets()
  const [items, setItems] = useState<SubscriptionListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<SubscriptionFilter>(intentFilter ?? 'all')
  const [searchQuery, setSearchQuery] = useState('')
  const [actionId, setActionId] = useState<string | null>(null)
  const [approving, setApproving] = useState<SubscriptionListItem | null>(null)
  const [viewing, setViewing] = useState<SubscriptionListItem | null>(null)

  useEffect(() => {
    if (intentFilter) setFilter(intentFilter)
  }, [intentFilter])

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = opts?.silent ?? false
      if (!silent) {
        setLoading(true)
        setError(null)
      }
      const result = await fetchAmanatSubscriptions()
      if (!result.ok) {
        if (result.unauthorized) onUnauthorized()
        setItems([])
        setError(result.error)
        if (!silent) setLoading(false)
        return
      }
      setItems(result.data)
      if (!silent) setLoading(false)
    },
    [onUnauthorized],
  )

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return filterSubscriptions(items, filter).filter((item) => {
      if (!q) return true
      return (
        item.accountName.toLowerCase().includes(q) ||
        item.accountType.toLowerCase().includes(q) ||
        item.tier.toLowerCase().includes(q)
      )
    })
  }, [items, filter, searchQuery])

  const filterCounts = useMemo(
    () => ({
      all: items.length,
      pending: filterSubscriptions(items, 'pending').length,
      expiring: filterSubscriptions(items, 'expiring').length,
      expired: filterSubscriptions(items, 'expired').length,
    }),
    [items],
  )

  const runAction = useCallback(
    async (id: string, fn: () => ReturnType<typeof approveAmanatSubscription>): Promise<boolean> => {
      setActionId(id)
      setError(null)
      try {
        const result = await fn()
        if (!result.ok) {
          if (result.unauthorized) onUnauthorized()
          else setError(result.error)
          return false
        }
        await load({ silent: true })
        return true
      } finally {
        setActionId(null)
      }
    },
    [load, onUnauthorized],
  )

  function handleReject(item: SubscriptionListItem) {
    Alert.alert('Reject subscription?', `Reject subscription for “${item.accountName}”?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: () => void runAction(item.id, () => rejectAmanatSubscription(item.id)),
      },
    ])
  }

  function handleLock(item: SubscriptionListItem) {
    Alert.alert(
      'Lock account?',
      `Lock “${item.accountName}”? The user will not be able to sign in.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Lock',
          onPress: () => void runAction(item.id, () => suspendAmanatAccount(item.id)),
        },
      ],
    )
  }

  function handleDelete(item: SubscriptionListItem) {
    const msg = subscriptionIsActiveApproved(item)
      ? `Permanently delete active account “${item.accountName}” and all related data (agents, listings, teams)? This cannot be undone.`
      : `Permanently delete “${item.accountName}” and all related data? This cannot be undone.`
    Alert.alert('Delete account?', msg, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => void runAction(item.id, () => deleteAmanatAccount(item.id)),
      },
    ])
  }

  return (
    <View style={styles.root}>
      <View style={styles.toolbar}>
        <View style={styles.searchRow}>
          <View style={{ flex: 1 }}>
            <SearchField
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search account"
            />
          </View>
          <Pressable onPress={onSignOut} hitSlop={hitSlop} style={styles.signOut}>
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>
        </View>
        <View style={{ height: 10 }} />
        <FilterBar
          value={filter}
          onChange={setFilter}
          options={[
            { key: 'all', label: 'All', count: filterCounts.all },
            { key: 'pending', label: 'Pending', count: filterCounts.pending },
            { key: 'expiring', label: 'Expiring', count: filterCounts.expiring },
            { key: 'expired', label: 'Expired', count: filterCounts.expired },
          ]}
        />
      </View>

      {loading && items.length === 0 ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={color.brand} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: tabBarHeight(insets.bottom) + 24,
          }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => (
            <SubscriptionCard
              item={item}
              busy={actionId === item.id}
              onView={() => setViewing(item)}
              onApprove={() => setApproving(item)}
              onReject={() => handleReject(item)}
              onLock={() => handleLock(item)}
              onUnlock={() => void runAction(item.id, () => unlockAmanatAccount(item.id))}
              onDelete={() => handleDelete(item)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon={searchQuery || filter !== 'all' ? 'search-off' : 'home-work'}
              title={searchQuery ? 'No matches' : 'No subscriptions'}
              body={
                searchQuery
                  ? `Nothing matches “${searchQuery}”.`
                  : 'Nothing matches this filter yet.'
              }
            />
          }
          refreshing={loading}
          onRefresh={() => void load()}
        />
      )}

      {error ? (
        <View style={[styles.error, { bottom: tabBarHeight(insets.bottom) + 16 }]}>
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
        </View>
      ) : null}

      <ApproveSubscriptionSheet
        visible={approving != null}
        subscription={approving}
        onClose={() => setApproving(null)}
        onApprove={async (startsAt, endsAt) => {
          if (!approving) return false
          return runAction(approving.id, () =>
            approveAmanatSubscription(approving.id, startsAt, endsAt),
          )
        }}
      />

      <AccountDetailSheet
        visible={viewing != null}
        subscriptionId={viewing?.id ?? null}
        accountName={viewing?.accountName ?? ''}
        onClose={() => setViewing(null)}
        onUnauthorized={onUnauthorized}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  toolbar: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  signOut: {
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '600',
    color: color.brand,
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
})
