import { StyleSheet, Text, View } from 'react-native'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import { color, type } from '../../theme'

type Props = {
  icon?: string
  title: string
  body?: string
  compact?: boolean
}

export function EmptyState({ icon = 'inbox', title, body, compact }: Props) {
  return (
    <View style={[styles.wrap, compact && styles.compact]}>
      <View style={styles.iconWrap}>
        <MaterialIcons name={icon} size={28} color={color.textTertiary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 72,
  },
  compact: {
    paddingTop: 24,
    paddingBottom: 16,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: color.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    ...type.body,
    fontWeight: '700',
    textAlign: 'center',
  },
  body: {
    ...type.meta,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
})
