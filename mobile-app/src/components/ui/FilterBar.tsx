import { ScrollView, StyleSheet } from 'react-native'
import { CountChip } from './StatusChip'

export type FilterOption<T extends string> = {
  key: T
  label: string
  count?: number
}

type Props<T extends string> = {
  options: FilterOption<T>[]
  value: T
  onChange: (value: T) => void
}

export function FilterBar<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {options.map((opt) => (
        <CountChip
          key={opt.key}
          label={opt.label}
          count={opt.count}
          active={value === opt.key}
          onPress={() => onChange(opt.key)}
        />
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
})
