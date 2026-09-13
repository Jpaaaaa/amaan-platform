import { StyleSheet, Text, View } from 'react-native'
import { TextField } from '../ui/TextField'
import { type } from '../../theme'

type Props = {
  days: string
  minutes: string
  onDays: (v: string) => void
  onMinutes: (v: string) => void
}

export function GraceFields({ days, minutes, onDays, onMinutes }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Works offline for</Text>
      <Text style={styles.hint}>Leave blank to use the server default window.</Text>
      <View style={styles.row}>
        <View style={styles.field}>
          <TextField
            value={days}
            onChangeText={onDays}
            keyboardType="numeric"
            placeholder="Days"
            style={styles.input}
          />
        </View>
        <View style={styles.field}>
          <TextField
            value={minutes}
            onChangeText={onMinutes}
            keyboardType="numeric"
            placeholder="Minutes"
            style={styles.input}
          />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 4,
  },
  label: {
    ...type.label,
    marginBottom: 4,
  },
  hint: {
    ...type.caption,
    marginBottom: 8,
    lineHeight: 18,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  field: {
    flex: 1,
  },
  input: {
    marginBottom: 0,
  },
})
