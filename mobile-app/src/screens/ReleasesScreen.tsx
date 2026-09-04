import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { getReleases } from '../api/client'
import { ProductSwitcher } from '../components/ProductSwitcher'
import type { PlatformProductKey, PlatformUpdateFileEntry } from '../types'
import { PLATFORM_PRODUCT_BAZAR } from '../types'

type Props = {
  onUnauthorized: () => void
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleString()
}

export function ReleasesScreen({ onUnauthorized }: Props) {
  const [product, setProduct] = useState<PlatformProductKey>(PLATFORM_PRODUCT_BAZAR)
  const [files, setFiles] = useState<PlatformUpdateFileEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const r = await getReleases(product)
    setLoading(false)
    if (!r.ok) {
      if (r.unauthorized) {
        onUnauthorized()
        return
      }
      setError(r.error)
      return
    }
    setFiles(r.releases.files ?? [])
  }, [product, onUnauthorized])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <View style={styles.root}>
      <ProductSwitcher value={product} onChange={setProduct} />

      {loading ? (
        <ActivityIndicator style={styles.loader} color="#0a6cff" />
      ) : (
        <FlatList
          data={files}
          keyExtractor={(f) => f.name}
          refreshing={loading}
          onRefresh={() => void load()}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.name} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={styles.meta}>
                {formatBytes(item.sizeBytes)} · {formatDate(item.modifiedAtMs)}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No release artifacts for this product.</Text>
          }
        />
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}
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
  row: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  meta: {
    fontSize: 12,
    color: '#64748b',
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
})
