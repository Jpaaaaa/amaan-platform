import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fetchNeighborhoods, type Neighborhood } from '../api/amanat'
import { AmanatGate } from '../components/AmanatGate'
import { AppHeader } from '../components/ui/AppHeader'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorBanner } from '../components/ui/ErrorBanner'
import { tabBarHeight } from '../constants/layout'
import { useWorkspace } from '../context/WorkspaceContext'
import { isAmanatProduct } from '../types'
import { color, radius, shadow } from '../theme'

type Props = {
  onBack?: () => void
}

export function ZonesScreen({ onBack }: Props) {
  const insets = useSafeAreaInsets()
  const { product } = useWorkspace()

  return (
    <View style={styles.root}>
      <AppHeader
        title="Zones"
        subtitle="Neighborhoods"
        showBack={Boolean(onBack)}
        onBack={onBack}
      />
      {!isAmanatProduct(product) ? (
        <EmptyState
          icon="map"
          title="Amanat only"
          body="Switch to the Amanat workspace to see neighborhood zones."
        />
      ) : (
        <AmanatGate>
          {({ signOut }) => <ZonesList bottomInset={insets.bottom} onUnauthorized={signOut} />}
        </AmanatGate>
      )}
    </View>
  )
}

function ZonesList({
  bottomInset,
  onUnauthorized,
}: {
  bottomInset: number
  onUnauthorized: () => void
}) {
  const [zones, setZones] = useState<Neighborhood[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await fetchNeighborhoods()
    setLoading(false)
    if (!result.ok) {
      if (result.unauthorized) onUnauthorized()
      setZones([])
      setError(result.error)
      return
    }
    setZones(result.data)
  }, [onUnauthorized])

  useEffect(() => {
    void load()
  }, [load])

  if (loading && zones.length === 0) {
    return <ActivityIndicator color={color.brand} style={{ marginTop: 48 }} />
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.note}>
        <Text style={styles.noteTitle}>Edit on web</Text>
        <Text style={styles.noteBody}>
          This list is name and city only. Draw or change boundaries in the web admin.
        </Text>
      </View>
      {error ? (
        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
        </View>
      ) : null}
      <FlatList
        data={zones}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: tabBarHeight(bottomInset) + 24,
        }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.city}>{item.city}</Text>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="map"
            title="No zones"
            body="Neighborhoods created on the web will show up here."
          />
        }
        refreshing={loading}
        onRefresh={() => void load()}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: color.bg,
  },
  note: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: color.brandMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    padding: 14,
  },
  noteTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: color.brandText,
    marginBottom: 4,
  },
  noteBody: {
    fontSize: 13,
    color: color.brandText,
    lineHeight: 18,
  },
  card: {
    backgroundColor: color.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.border,
    padding: 14,
    ...shadow.card,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: color.text,
  },
  city: {
    fontSize: 13,
    color: color.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
})
