import { useEffect, useState } from 'react'
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { SubscriptionListItem } from '../api/amanat'
import { subscriptionCanRenew } from '../lib/subscription-status'
import { color, radius, shadow } from '../theme'
import { Button } from './ui/Button'
import { ErrorBanner } from './ui/ErrorBanner'
import { TextField } from './ui/TextField'

const YMD = /^\d{4}-\d{2}-\d{2}$/

type Props = {
  visible: boolean
  subscription: SubscriptionListItem | null
  onClose: () => void
  onApprove: (startsAt: string, endsAt: string) => Promise<boolean>
}

function todayYmd(): string {
  return new Date().toISOString().slice(0, 10)
}

export function ApproveSubscriptionSheet({
  visible,
  subscription,
  onClose,
  onApprove,
}: Props) {
  const insets = useSafeAreaInsets()
  const renew = subscription ? subscriptionCanRenew(subscription) : false
  const [startsAt, setStartsAt] = useState(todayYmd())
  const [endsAt, setEndsAt] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!visible) return
    setStartsAt(todayYmd())
    setEndsAt('')
    setError(null)
    setBusy(false)
  }, [visible, subscription?.id])

  async function submit() {
    if (!YMD.test(startsAt) || Number.isNaN(new Date(startsAt).getTime())) {
      setError('Activation date must be YYYY-MM-DD.')
      return
    }
    if (!endsAt) {
      setError('Expiry date is required.')
      return
    }
    if (!YMD.test(endsAt) || Number.isNaN(new Date(endsAt).getTime())) {
      setError('Expiry date must be YYYY-MM-DD.')
      return
    }
    if (new Date(endsAt) <= new Date(startsAt)) {
      setError('Expiry must be after the activation date.')
      return
    }
    setError(null)
    setBusy(true)
    const ok = await onApprove(startsAt, endsAt)
    setBusy(false)
    if (ok) onClose()
    else setError(renew ? 'Failed to renew subscription.' : 'Failed to approve subscription.')
  }

  return (
    <Modal visible={visible && subscription != null} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.flex} onPress={onClose} />
        <View style={[styles.card, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>{renew ? 'Renew' : 'Approve'}</Text>
          {subscription ? (
            <Text style={styles.sub}>
              {renew ? 'Set new subscription dates for ' : 'Set activation and expiry dates for '}
              <Text style={styles.strong}>{subscription.accountName}</Text>
            </Text>
          ) : null}
          <TextField
            label="Activation date"
            value={startsAt}
            onChangeText={setStartsAt}
            placeholder="YYYY-MM-DD"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!busy}
            keyboardType="numbers-and-punctuation"
          />
          <TextField
            label="Expiry date"
            value={endsAt}
            onChangeText={setEndsAt}
            placeholder="YYYY-MM-DD"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!busy}
            keyboardType="numbers-and-punctuation"
          />
          {error ? (
            <View style={{ marginBottom: 12 }}>
              <ErrorBanner message={error} />
            </View>
          ) : null}
          <View style={styles.row}>
            <Button title="Cancel" variant="secondary" onPress={onClose} disabled={busy} style={styles.flex} />
            <Button
              title={renew ? 'Renew' : 'Save'}
              onPress={() => void submit()}
              loading={busy}
              disabled={busy}
              style={styles.flex}
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
  flex: { flex: 1 },
  card: {
    backgroundColor: color.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: 20,
    paddingTop: 12,
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
    marginBottom: 6,
  },
  sub: {
    fontSize: 14,
    color: color.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  strong: {
    fontWeight: '700',
    color: color.text,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
})
