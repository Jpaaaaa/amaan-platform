import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fetchAmanatAccount, type AdminAccountDetail } from '../api/amanat'
import { formatSubscriptionDate } from '../lib/subscription-status'
import { color, radius, shadow } from '../theme'
import { ErrorBanner } from './ui/ErrorBanner'

type Props = {
  visible: boolean
  subscriptionId: string | null
  accountName: string
  onClose: () => void
  onUnauthorized: () => void
}

function roleLabel(role: string): string {
  return role.replace(/_/g, ' ').toLowerCase()
}

export function AccountDetailSheet({
  visible,
  subscriptionId,
  accountName,
  onClose,
  onUnauthorized,
}: Props) {
  const insets = useSafeAreaInsets()
  const [account, setAccount] = useState<AdminAccountDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!subscriptionId) return
    setLoading(true)
    setError(null)
    const result = await fetchAmanatAccount(subscriptionId)
    setLoading(false)
    if (!result.ok) {
      if (result.unauthorized) onUnauthorized()
      else setError(result.error)
      setAccount(null)
      return
    }
    setAccount(result.data)
  }, [subscriptionId, onUnauthorized])

  useEffect(() => {
    if (!visible || !subscriptionId) return
    void load()
  }, [visible, subscriptionId, load])

  return (
    <Modal visible={visible && subscriptionId != null} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.card, { paddingBottom: insets.bottom + 16 }]} onPress={() => {}}>
          <View style={styles.handle} />
          <Text style={styles.title}>{accountName}</Text>
          {account ? (
            <Text style={styles.sub}>
              {account.accountType} · {account.tier.toLowerCase()}
              {account.isLocked ? ' · locked' : ''}
            </Text>
          ) : null}

          {loading ? <ActivityIndicator color={color.brand} style={{ marginVertical: 24 }} /> : null}
          {error ? (
            <View style={{ marginBottom: 12 }}>
              <ErrorBanner message={error} />
            </View>
          ) : null}

          {account && !loading ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Fact
                label="Subscription period"
                value={`${formatSubscriptionDate(account.startsAt)} – ${formatSubscriptionDate(account.endsAt)}`}
              />
              {account.joinCode ? <Fact label="Join code" value={account.joinCode} mono /> : null}
              {account.notes ? <Fact label="Notes" value={account.notes} /> : null}

              <Text style={styles.section}>
                {account.accountType === 'individual' ? 'User' : 'Users & agents'}
              </Text>
              {account.accountUsers.length === 0 ? (
                <Text style={styles.empty}>No users found.</Text>
              ) : (
                account.accountUsers.map((user) => (
                  <View key={user.id} style={styles.user}>
                    <View style={styles.userTop}>
                      <Text style={styles.userName}>{user.fullName}</Text>
                      <Text style={styles.role}>{roleLabel(user.role)}</Text>
                    </View>
                    {user.officeName ? (
                      <Text style={styles.office}>Office: {user.officeName}</Text>
                    ) : null}
                    <Text style={styles.email}>{user.email}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  )
}

function Fact({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={[styles.factValue, mono && styles.mono]} selectable>
        {value}
      </Text>
    </View>
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
    maxHeight: '90%',
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
    letterSpacing: -0.3,
  },
  sub: {
    fontSize: 13,
    color: color.textSecondary,
    marginTop: 4,
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  fact: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.border,
  },
  factLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: color.textTertiary,
    marginBottom: 4,
  },
  factValue: {
    fontSize: 15,
    fontWeight: '500',
    color: color.text,
  },
  mono: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
  },
  section: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: color.textTertiary,
    marginTop: 18,
    marginBottom: 8,
  },
  empty: {
    fontSize: 14,
    color: color.textSecondary,
    paddingBottom: 12,
  },
  user: {
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 8,
    backgroundColor: color.surfaceMuted,
  },
  userTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  userName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: color.text,
  },
  role: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    color: color.textTertiary,
  },
  office: {
    fontSize: 12,
    color: color.textSecondary,
    marginTop: 4,
  },
  email: {
    fontSize: 13,
    color: color.textSecondary,
    marginTop: 4,
  },
})
