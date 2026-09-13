import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { SubscriptionListItem } from '../api/amanat'
import {
  formatSubscriptionDate,
  subscriptionCanRenew,
  subscriptionIsActiveApproved,
  subscriptionStatusLabel,
  subscriptionStatusTone,
} from '../lib/subscription-status'
import { color, radius, shadow } from '../theme'
import { Button } from './ui/Button'
import { StatusChip } from './ui/StatusChip'

type Props = {
  item: SubscriptionListItem
  busy: boolean
  onView: () => void
  onApprove: () => void
  onReject: () => void
  onLock: () => void
  onUnlock: () => void
  onDelete: () => void
}

export function SubscriptionCard({
  item,
  busy,
  onView,
  onApprove,
  onReject,
  onLock,
  onUnlock,
  onDelete,
}: Props) {
  const pending = item.paymentStatus === 'PENDING'
  const renew = subscriptionCanRenew(item)
  const active = subscriptionIsActiveApproved(item)

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onView}
    >
      <View style={styles.top}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.name} numberOfLines={1}>
            {item.accountName}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {item.accountType}
            {item.isLocked ? ' · locked' : ''}
          </Text>
        </View>
        <StatusChip label={subscriptionStatusLabel(item)} tone={subscriptionStatusTone(item)} dot />
      </View>

      <View style={styles.facts}>
        <Fact label="Tier" value={item.tier.toLowerCase()} />
        <Fact
          label="Agents"
          value={
            item.accountType === 'individual' ? '—' : `${item.agentsCount} / ${item.maxAgents}`
          }
          danger={item.accountType !== 'individual' && item.agentsCount >= item.maxAgents}
        />
        <Fact label="Starts" value={formatSubscriptionDate(item.startsAt)} />
        <Fact label="Ends" value={formatSubscriptionDate(item.endsAt)} />
      </View>

      <View style={styles.actions}>
        <Button title="View" variant="secondary" compact onPress={onView} disabled={busy} />
        {pending ? (
          <>
            <Button title="Approve" compact onPress={onApprove} disabled={busy} loading={busy} />
            <Button title="Reject" variant="secondary" compact onPress={onReject} disabled={busy} />
          </>
        ) : null}
        {renew ? (
          <Button title="Renew" compact onPress={onApprove} disabled={busy} loading={busy} />
        ) : null}
        {active && !item.isLocked ? (
          <Button title="Lock" variant="secondary" compact onPress={onLock} disabled={busy} />
        ) : null}
        {active && item.isLocked ? (
          <Button title="Unlock" variant="secondary" compact onPress={onUnlock} disabled={busy} />
        ) : null}
        <Button title="Delete" variant="danger" compact onPress={onDelete} disabled={busy} />
      </View>
    </Pressable>
  )
}

function Fact({
  label,
  value,
  danger,
}: {
  label: string
  value: string
  danger?: boolean
}) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={[styles.factValue, danger && { color: color.danger }]}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.surface,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: color.border,
    ...shadow.card,
  },
  pressed: {
    backgroundColor: color.surfaceMuted,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: color.text,
    letterSpacing: -0.2,
  },
  meta: {
    fontSize: 13,
    color: color.textSecondary,
    fontWeight: '500',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  facts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  fact: {
    width: '50%',
    marginBottom: 10,
  },
  factLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: color.textTertiary,
    marginBottom: 2,
  },
  factValue: {
    fontSize: 14,
    fontWeight: '500',
    color: color.text,
    textTransform: 'capitalize',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color.border,
    paddingTop: 12,
    marginTop: 2,
  },
})
