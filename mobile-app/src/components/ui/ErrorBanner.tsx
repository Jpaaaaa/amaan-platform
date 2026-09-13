import { Pressable, StyleSheet, Text, View } from 'react-native'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import { color, radius } from '../../theme'

type Props = {
  message: string
  onDismiss?: () => void
}

export function ErrorBanner({ message, onDismiss }: Props) {
  return (
    <View style={styles.wrap}>
      <MaterialIcons name="error-outline" size={16} color={color.danger} />
      <Text style={styles.text}>{message}</Text>
      {onDismiss ? (
        <Pressable onPress={onDismiss} hitSlop={8} accessibilityLabel="Dismiss">
          <MaterialIcons name="close" size={16} color={color.danger} />
        </Pressable>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: color.dangerMuted,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  text: {
    flex: 1,
    color: color.danger,
    fontSize: 13,
    fontWeight: '500',
  },
})
