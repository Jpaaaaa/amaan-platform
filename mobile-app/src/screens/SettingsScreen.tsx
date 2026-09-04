import { Pressable, StyleSheet, Text, View } from 'react-native'
import { getApiBaseUrl, logout } from '../api/client'

type Props = {
  onLogout: () => void
}

export function SettingsScreen({ onLogout }: Props) {
  async function handleLogout() {
    await logout()
    onLogout()
  }

  return (
    <View style={styles.root}>
      <Text style={styles.heading}>Settings</Text>

      <View style={styles.card}>
        <Text style={styles.label}>API base URL</Text>
        <Text style={styles.value} selectable>
          {getApiBaseUrl()}
        </Text>
      </View>

      <Pressable style={styles.logoutBtn} onPress={() => void handleLogout()}>
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8fafc',
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  value: {
    fontSize: 14,
    color: '#0f172a',
    lineHeight: 20,
  },
  logoutBtn: {
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: {
    color: '#b91c1c',
    fontSize: 16,
    fontWeight: '700',
  },
})
