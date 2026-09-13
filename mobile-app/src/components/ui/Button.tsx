import type { ReactNode } from 'react'
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import { color, radius } from '../../theme'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'dangerSolid'

type Props = Omit<PressableProps, 'style'> & {
  title: string
  variant?: Variant
  loading?: boolean
  icon?: ReactNode
  compact?: boolean
  style?: StyleProp<ViewStyle>
}

export function Button({
  title,
  variant = 'primary',
  loading,
  icon,
  compact,
  disabled,
  style,
  ...rest
}: Props) {
  const isDisabled = disabled || loading
  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        compact && styles.compact,
        styles[variant],
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      <View style={styles.row}>
        {icon}
        <Text
          style={[
            styles.text,
            variant === 'secondary' && styles.textSecondary,
            variant === 'ghost' && styles.textGhost,
            variant === 'danger' && styles.textDanger,
            (variant === 'primary' || variant === 'dangerSolid') && styles.textOnBrand,
          ]}
        >
          {loading ? 'Please wait…' : title}
        </Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  compact: {
    minHeight: 40,
    paddingHorizontal: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  primary: {
    backgroundColor: color.brand,
  },
  secondary: {
    backgroundColor: color.surfaceMuted,
    borderWidth: 1,
    borderColor: color.border,
  },
  danger: {
    backgroundColor: color.dangerMuted,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  dangerSolid: {
    backgroundColor: color.danger,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.88,
  },
  disabled: {
    opacity: 0.45,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
  },
  textOnBrand: {
    color: color.white,
  },
  textSecondary: {
    color: color.text,
  },
  textGhost: {
    color: color.textSecondary,
  },
  textDanger: {
    color: color.danger,
  },
})
