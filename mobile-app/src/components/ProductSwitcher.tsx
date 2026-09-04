import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { PlatformProductKey } from '../types'
import { PLATFORM_PRODUCT_BAZAR, PLATFORM_PRODUCT_SUFRA } from '../types'

const OPTIONS: { key: PlatformProductKey; label: string }[] = [
  { key: PLATFORM_PRODUCT_BAZAR, label: 'Bazar One' },
  { key: PLATFORM_PRODUCT_SUFRA, label: 'Sufra' },
]

type Props = {
  value: PlatformProductKey
  onChange: (product: PlatformProductKey) => void
}

export function ProductSwitcher({ value, onChange }: Props) {
  return (
    <View style={styles.row}>
      {OPTIONS.map((opt) => {
        const active = opt.key === value
        return (
          <Pressable
            key={opt.key}
            style={[styles.segment, active && styles.segmentActive]}
            onPress={() => onChange(opt.key)}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{opt.label}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: '#e8ecf1',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5c6670',
  },
  labelActive: {
    color: '#0a6cff',
  },
})
