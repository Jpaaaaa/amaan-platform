import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import { fetchAmanatSubscriptions, type SubscriptionListItem } from '../api/amanat'
import { getActivationRequests, getDevices } from '../api/client'
import { AmanatLoginForm } from '../components/AmanatLoginForm'
import { tabBarHeight } from '../constants/layout'
import { useWorkspace } from '../context/WorkspaceContext'
import { ErrorBanner } from '../components/ui/ErrorBanner'
import { StatusChip } from '../components/ui/StatusChip'
import { clearAmanatToken, isAmanatAuthenticated } from '../lib/amanat-auth'
import {
  filterSubscriptions,
  subscriptionStatusLabel,
} from '../lib/subscription-status'
import type { MainTabParamList } from '../navigation/types'
import { isAmanatProduct, type ActivationRequestRow, type DeviceRow } from '../types'
import { deviceHealth } from '../utils/deviceDisplay'
import { formatRelativeAge } from '../utils/requestDisplay'
import { color, radius, shadow } from '../theme'

type Props = {
  onUnauthorized: () => void
}

type Tone = 'brand' | 'warning' | 'danger' | 'success' | 'neutral'

type Metric = {
  key: string
  kicker: string
  count: number
  caption: string
  cta: string
  tone: Tone
  onPress: () => void
}

const TONE_BG: Record<Tone, string> = {
  brand: color.brandMuted,
  warning: color.warningMuted,
  danger: color.dangerMuted,
  success: color.successMuted,
  neutral: color.surface,
}

const TONE_FG: Record<Tone, string> = {
  brand: color.brandText,
  warning: color.warning,
  danger: color.danger,
  success: color.success,
  neutral: color.text,
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function HomeScreen({ onUnauthorized }: Props) {
  const insets = useSafeAreaInsets()
  const { product } = useWorkspace()
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [devices, setDevices] = useState<DeviceRow[]>([])
  const [pending, setPending] = useState<ActivationRequestRow[]>([])
  const [subscriptions, setSubscriptions] = useState<SubscriptionListItem[]>([])
  const [amanatAuthed, setAmanatAuthed] = useState(false)

  const amanat = isAmanatProduct(product)

  const load = useCallback(async () => {
    if (isAmanatProduct(product)) {
      setDevices([])
      setPending([])
      setError(null)
      const signedIn = await isAmanatAuthenticated()
      setAmanatAuthed(signedIn)
      if (!signedIn) {
        setSubscriptions([])
        setLoading(false)
        return
      }
      const result = await fetchAmanatSubscriptions()
      if (!result.ok) {
        if (result.unauthorized) {
          await clearAmanatToken()
          setAmanatAuthed(false)
        }
        setSubscriptions([])
        setError(result.error)
        setLoading(false)
        return
      }
      setSubscriptions(result.data)
      setLoading(false)
      return
    }
    setSubscriptions([])
    setAmanatAuthed(false)
    setError(null)
    const [d, r] = await Promise.all([
      getDevices(product),
      getActivationRequests(product, 'pending'),
    ])
    if (!d.ok) {
      if (d.unauthorized) {
        onUnauthorized()
        return
      }
      setError(d.error)
      setLoading(false)
      return
    }
    if (!r.ok) {
      if (r.unauthorized) {
        onUnauthorized()
        return
      }
      setError(r.error)
      setLoading(false)
      return
    }
    setDevices(d.devices)
    setPending(r.requests)
    setLoading(false)
  }, [product, onUnauthorized])

  useEffect(() => {
    setLoading(true)
    void load()
  }, [load])

  const expiring = devices.filter((d) => deviceHealth(d) === 'expiring').length
  const expired = devices.filter((d) => deviceHealth(d) === 'expired').length
  const sync = devices.filter((d) => deviceHealth(d) === 'sync').length
  const pendingSubs = filterSubscriptions(subscriptions, 'pending')
  const expiringSubs = filterSubscriptions(subscriptions, 'expiring')
  const expiredSubs = filterSubscriptions(subscriptions, 'expired')
  const queueCount = amanat
    ? pendingSubs.length + expiringSubs.length + expiredSubs.length
    : pending.length + expiring + expired + sync

  const { hero, small } = useMemo(() => {
    const metrics: Metric[] = amanat
      ? [
          {
            key: 'pending',
            kicker: 'Pending',
            count: pendingSubs.length,
            caption: 'Awaiting approval',
            cta: 'Review',
            tone: 'brand',
            onPress: () => navigation.navigate('Workspaces', { filter: 'pending' }),
          },
          {
            key: 'expired',
            kicker: 'Expired',
            count: expiredSubs.length,
            caption: 'Subscriptions ended',
            cta: 'Open',
            tone: 'danger',
            onPress: () => navigation.navigate('Workspaces', { filter: 'expired' }),
          },
          {
            key: 'expiring',
            kicker: 'Expire',
            count: expiringSubs.length,
            caption: 'Ending soon',
            cta: 'Open',
            tone: 'warning',
            onPress: () => navigation.navigate('Workspaces', { filter: 'expiring' }),
          },
          {
            key: 'all',
            kicker: 'Accounts',
            count: subscriptions.length,
            caption: 'All subscriptions',
            cta: 'Open',
            tone: 'brand',
            onPress: () => navigation.navigate('Workspaces', { filter: 'all' }),
          },
        ]
      : [
          {
            key: 'pending',
            kicker: 'Requests',
            count: pending.length,
            caption: 'Pending activations',
            cta: 'Review',
            tone: 'brand',
            onPress: () => navigation.navigate('Workspaces', { inbox: true }),
          },
          {
            key: 'expired',
            kicker: 'Expired',
            count: expired,
            caption: 'Licenses ended',
            cta: 'Open',
            tone: 'danger',
            onPress: () => navigation.navigate('Workspaces', { filter: 'expired' }),
          },
          {
            key: 'expiring',
            kicker: 'Expire',
            count: expiring,
            caption: 'This week',
            cta: 'Open',
            tone: 'warning',
            onPress: () => navigation.navigate('Workspaces', { filter: 'expiring' }),
          },
          {
            key: 'sync',
            kicker: 'Sync',
            count: sync,
            caption: 'Needs a sync',
            cta: 'Open',
            tone: 'warning',
            onPress: () => navigation.navigate('Workspaces', { filter: 'sync' }),
          },
        ]
    const hot = metrics.find((m) => m.count > 0)
    const heroMetric: Metric =
      hot ??
      ({
        key: 'devices',
        kicker: 'Workspaces',
        count: amanat ? subscriptions.length : devices.length,
        caption: 'All clear in this workspace',
        cta: 'Open list',
        tone: 'success',
        onPress: () => navigation.navigate('Workspaces'),
      } satisfies Metric)
    const rest = metrics.filter((m) => m.key !== heroMetric.key).slice(0, 2)
    return { hero: heroMetric, small: rest }
  }, [
    amanat,
    pending.length,
    expired,
    expiring,
    sync,
    devices.length,
    pendingSubs.length,
    expiredSubs.length,
    expiringSubs.length,
    subscriptions.length,
    navigation,
  ])

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Image
          source={require('../../public/amanlogo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.greet}>{greeting()}</Text>
          <Text style={styles.homeTitle}>Deck</Text>
          <Text style={styles.homeSub}>
            {amanat
              ? !amanatAuthed
                ? 'Sign in to Amanat admin'
                : queueCount === 0
                  ? `All clear · ${subscriptions.length} accounts`
                  : `${queueCount} need you · ${subscriptions.length} accounts`
              : queueCount === 0
                ? `All clear · ${devices.length} devices`
                : `${queueCount} need you · ${devices.length} devices`}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: tabBarHeight(insets.bottom) + 24 }}
        refreshControl={
          amanat && !amanatAuthed ? undefined : (
            <RefreshControl
              refreshing={
                loading &&
                (amanat
                  ? subscriptions.length > 0
                  : devices.length + pending.length > 0)
              }
              onRefresh={() => void load()}
            />
          )
        }
        showsVerticalScrollIndicator={false}
      >
        {amanat && !amanatAuthed ? (
          <View style={styles.pad}>
            <AmanatLoginForm
              onLoggedIn={() => {
                setAmanatAuthed(true)
                setLoading(true)
                void load()
              }}
            />
          </View>
        ) : loading &&
          (amanat
            ? subscriptions.length === 0
            : devices.length === 0 && pending.length === 0) ? (
          <ActivityIndicator color={color.brand} style={{ marginTop: 48 }} />
        ) : (
          <>
            {error ? (
              <View style={styles.pad}>
                <ErrorBanner message={error} />
              </View>
            ) : null}

            <View style={styles.bento}>
              <LargeTile metric={hero} />
              <View style={styles.smallCol}>
                {small.map((m) => (
                  <SmallTile key={m.key} metric={m} />
                ))}
              </View>
            </View>

            <Text style={styles.section}>Shortcuts</Text>
            <View style={styles.shortcuts}>
              <Shortcut
                icon="layers"
                label="Workspaces"
                onPress={() => navigation.navigate('Workspaces')}
              />
              {amanat ? (
                <>
                  <Shortcut
                    icon="hourglass-empty"
                    label="Pending"
                    onPress={() => navigation.navigate('Workspaces', { filter: 'pending' })}
                  />
                  <Shortcut
                    icon="schedule"
                    label="Expiring"
                    onPress={() => navigation.navigate('Workspaces', { filter: 'expiring' })}
                  />
                  <Shortcut
                    icon="map"
                    label="Zones"
                    onPress={() => navigation.navigate('More', { screen: 'Zones' })}
                  />
                </>
              ) : (
                <>
                  <Shortcut
                    icon="inbox"
                    label="Requests"
                    onPress={() => navigation.navigate('Workspaces', { inbox: true })}
                  />
                  <Shortcut
                    icon="system-update"
                    label="Releases"
                    onPress={() => navigation.navigate('More', { screen: 'Releases' })}
                  />
                  <Shortcut
                    icon="add"
                    label="Add"
                    onPress={() => navigation.navigate('Workspaces', { create: true })}
                  />
                </>
              )}
            </View>

            {amanat && pendingSubs.length > 0 ? (
              <>
                <View style={styles.sectionRow}>
                  <Text style={[styles.section, { paddingHorizontal: 0, marginTop: 0 }]}>
                    Up next
                  </Text>
                  <Pressable onPress={() => navigation.navigate('Workspaces', { filter: 'pending' })}>
                    <Text style={styles.seeAll}>See all</Text>
                  </Pressable>
                </View>
                {pendingSubs.slice(0, 3).map((item) => (
                  <Pressable
                    key={item.id}
                    style={styles.preview}
                    onPress={() => navigation.navigate('Workspaces', { filter: 'pending' })}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.previewTitle} numberOfLines={1}>
                        {item.accountName}
                      </Text>
                      <Text style={styles.previewMeta} numberOfLines={1}>
                        {item.accountType} · {item.tier.toLowerCase()}
                      </Text>
                    </View>
                    <StatusChip label={subscriptionStatusLabel(item)} tone="brand" />
                  </Pressable>
                ))}
              </>
            ) : null}

            {!amanat && pending.length > 0 ? (
              <>
                <View style={styles.sectionRow}>
                  <Text style={[styles.section, { paddingHorizontal: 0, marginTop: 0 }]}>
                    Up next
                  </Text>
                  <Pressable onPress={() => navigation.navigate('Workspaces', { inbox: true })}>
                    <Text style={styles.seeAll}>See all</Text>
                  </Pressable>
                </View>
                {pending.slice(0, 3).map((row) => (
                  <Pressable
                    key={row.machineId}
                    style={styles.preview}
                    onPress={() => navigation.navigate('Workspaces', { inbox: true })}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.previewTitle} numberOfLines={1}>
                        {row.store.storeName || 'Unnamed store'}
                      </Text>
                      <Text style={styles.previewMeta} numberOfLines={1}>
                        {row.store.city?.trim() || 'Activation request'}
                      </Text>
                    </View>
                    <StatusChip label={formatRelativeAge(row.updatedAtMs)} tone="brand" />
                  </Pressable>
                ))}
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  )
}

function LargeTile({ metric }: { metric: Metric }) {
  return (
    <Pressable
      onPress={metric.onPress}
      style={({ pressed }) => [
        styles.large,
        { backgroundColor: TONE_BG[metric.tone] },
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.kicker, { color: TONE_FG[metric.tone] }]}>{metric.kicker}</Text>
      <Text style={[styles.heroNum, { color: TONE_FG[metric.tone] }]}>{metric.count}</Text>
      <Text style={styles.heroCap}>{metric.caption}</Text>
      <View style={styles.ctaRow}>
        <Text style={[styles.cta, { color: TONE_FG[metric.tone] }]}>{metric.cta}</Text>
        <MaterialIcons name="arrow-forward" size={14} color={TONE_FG[metric.tone]} />
      </View>
    </Pressable>
  )
}

function SmallTile({ metric }: { metric: Metric }) {
  const muted = metric.count === 0
  return (
    <Pressable
      onPress={metric.onPress}
      style={({ pressed }) => [
        styles.small,
        { backgroundColor: muted ? color.surface : TONE_BG[metric.tone] },
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.kicker, { color: muted ? color.textTertiary : TONE_FG[metric.tone] }]}>
        {metric.kicker}
      </Text>
      <Text
        style={[
          styles.smallNum,
          { color: muted ? color.textTertiary : TONE_FG[metric.tone] },
        ]}
      >
        {metric.count}
      </Text>
      <Text style={styles.smallCap} numberOfLines={1}>
        {metric.caption}
      </Text>
    </Pressable>
  )
}

function Shortcut({
  icon,
  label,
  onPress,
}: {
  icon: string
  label: string
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.cut, pressed && styles.pressed]}>
      <View style={styles.cutIcon}>
        <MaterialIcons name={icon} size={22} color={color.brandText} />
      </View>
      <Text style={styles.cutLabel} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
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
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  logo: {
    width: 40,
    height: 40,
  },
  greet: {
    fontSize: 13,
    fontWeight: '500',
    color: color.textSecondary,
  },
  homeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: color.text,
    letterSpacing: -0.6,
    marginTop: 1,
  },
  homeSub: {
    fontSize: 13,
    fontWeight: '500',
    color: color.textTertiary,
    marginTop: 2,
  },
  pad: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  bento: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    minHeight: 176,
  },
  large: {
    flex: 1.75,
    minHeight: 176,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: color.border,
    justifyContent: 'space-between',
    ...shadow.card,
  },
  smallCol: {
    flex: 1,
    gap: 12,
  },
  small: {
    flex: 1,
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: color.border,
    justifyContent: 'space-between',
    ...shadow.card,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  kicker: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  heroNum: {
    fontSize: 44,
    fontWeight: '700',
    letterSpacing: -1.5,
    marginTop: 8,
  },
  heroCap: {
    fontSize: 14,
    fontWeight: '600',
    color: color.text,
    marginTop: 4,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
  },
  cta: {
    fontSize: 13,
    fontWeight: '700',
  },
  smallNum: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  smallCap: {
    fontSize: 12,
    fontWeight: '500',
    color: color.textSecondary,
  },
  section: {
    fontSize: 13,
    fontWeight: '600',
    color: color.textSecondary,
    paddingHorizontal: 16,
    marginTop: 22,
    marginBottom: 10,
  },
  shortcuts: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
  },
  cut: {
    flex: 1,
    alignItems: 'center',
  },
  cutIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  cutLabel: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: '600',
    color: color.text,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 22,
    marginBottom: 10,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '600',
    color: color.brand,
  },
  preview: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: color.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...shadow.card,
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: color.text,
  },
  previewMeta: {
    fontSize: 13,
    color: color.textSecondary,
    marginTop: 2,
  },
})
