import { useState } from 'react'
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native'
import { color, radius, type } from '../../theme'

type Props = TextInputProps & {
  label?: string
  hint?: string
}

export function TextField({ label, hint, style, onFocus, onBlur, ...rest }: Props) {
  const [focused, setFocused] = useState(false)
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={color.textTertiary}
        style={[styles.input, focused && styles.inputFocused, style]}
        onFocus={(e) => {
          setFocused(true)
          onFocus?.(e)
        }}
        onBlur={(e) => {
          setFocused(false)
          onBlur?.(e)
        }}
        {...rest}
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 14,
  },
  label: {
    ...type.label,
    marginBottom: 6,
  },
  input: {
    backgroundColor: color.surfaceMuted,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: color.text,
    fontWeight: '500',
  },
  inputFocused: {
    borderColor: color.brand,
    backgroundColor: color.surface,
  },
  hint: {
    ...type.caption,
    marginTop: 6,
    lineHeight: 18,
  },
})
