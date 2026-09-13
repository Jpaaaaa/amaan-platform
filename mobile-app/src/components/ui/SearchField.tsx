import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import { color, radius } from '../../theme'

type Props = {
  value: string
  onChangeText: (v: string) => void
  placeholder?: string
}

export function SearchField({ value, onChangeText, placeholder = 'Search' }: Props) {
  return (
    <View style={styles.wrap}>
      <MaterialIcons name="search" size={18} color={color.textTertiary} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={color.textTertiary}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="never"
        returnKeyType="search"
      />
      {value ? (
        <Pressable onPress={() => onChangeText('')} hitSlop={8} accessibilityLabel="Clear search">
          <MaterialIcons name="cancel" size={16} color={color.textTertiary} />
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
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: color.text,
    fontWeight: '500',
    padding: 0,
  },
})
