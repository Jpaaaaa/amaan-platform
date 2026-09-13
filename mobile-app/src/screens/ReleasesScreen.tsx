import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import { getReleases } from '../api/client'
import { AppHeader } from '../components/ui/AppHeader'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorBanner } from '../components/ui/ErrorBanner'
import { tabBarHeight } from '../constants/layout'
import { PRODUCT_META } from '../constants/products'
import { useWorkspace } from '../context/WorkspaceContext'
import { isAmanatProduct, type PlatformUpdateFileEntry } from '../types'
import { color, radius, shadow } from '../theme'

type Props = {
  onUnauthorized: () => void
  onBack?: () => void
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getFileIcon(name: string): { name: string; color: string; bg: string } {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  switch (ext) {
    case 'apk':
      return { name: 'android', color: '#059669', bg: '#ECFDF5' }
    case 'dmg':
    case 'ipa':
      return { name: 'phone-iphone', color: color.text, bg: color.surfaceMuted }
    case 'exe':
    case 'msi':
      return { name: 'desktop-windows', color: '#2563EB', bg: '#EFF6FF' }
    case 'zip':
    case 'rar':
    case 'tar':
    case 'gz':
      return { name: 'folder-zip', color: color.brand, bg: color.brandMuted }
    default:
      return { name: 'insert-drive-file', color: color.textSecondary, bg: color.surfaceMuted }
  }
}

export function ReleasesScreen({ onUnauthorized, onBack }: Props) {
  const insets = useSafeAreaInsets()
  const { product } = useWorkspace()
  const [files, setFiles] = useState<PlatformUpdateFileEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (isAmanatProduct(product)) {
      setFiles([])
      setLoading(false)
      setError(null)
      return
    }
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
      <AppHeader
        title="Releases"
        subtitle={`View only · ${PRODUCT_META[product].short}`}
        showBack={!!onBack}
        onBack={onBack}
      />

      {loading && files.length === 0 ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={color.brand} />
        </View>
      ) : (
        <FlatList
          data={files}
          keyExtractor={(f) => f.name}
          refreshing={loading}
          onRefresh={() => void load()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: tabBarHeight(insets.bottom) + 24,
          }}
          renderItem={({ item }) => {
            const iconInfo = getFileIcon(item.name)
            return (
              <View style={styles.row}>
                <View style={[styles.iconWrap, { backgroundColor: iconInfo.bg }]}>
                  <MaterialIcons name={iconInfo.name} size={20} color={iconInfo.color} />
                </View>
                <View style={styles.main}>
                  <Text style={styles.name} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.meta}>
                    {formatBytes(item.sizeBytes)} · {formatDate(item.modifiedAtMs)}
                  </Text>
                </View>
              </View>
            )
          }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <EmptyState
              icon="cloud-off"
              title="No packages"
              body="There are no release artifacts for this product."
            />
          }
        />
      )}

      {error ? (
        <View style={styles.error}>
          <ErrorBanner message={error} />
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: color.bg,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.surface,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: color.border,
    ...shadow.card,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  main: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: color.text,
    marginBottom: 4,
  },
  meta: {
    fontSize: 12,
    color: color.textSecondary,
  },
  error: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
})
