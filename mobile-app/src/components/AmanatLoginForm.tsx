import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { amanatLogin } from '../api/amanat'
import { setAmanatToken } from '../lib/amanat-auth'
import { color, radius, shadow } from '../theme'
import { Button } from './ui/Button'
import { ErrorBanner } from './ui/ErrorBanner'
import { TextField } from './ui/TextField'

export function AmanatLoginForm({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit() {
    setBusy(true)
    setError(null)
    const result = await amanatLogin(email.trim(), password)
    setBusy(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    await setAmanatToken(result.data.accessToken)
    onLoggedIn()
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Amanat Admin</Text>
      <Text style={styles.sub}>Sign in with your platform operator credentials</Text>
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        editable={!busy}
        placeholder="admin@amanat.iq"
      />
      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        editable={!busy}
        placeholder="••••••••"
        onSubmitEditing={() => {
          if (email && password && !busy) void onSubmit()
        }}
        returnKeyType="go"
      />
      {error ? (
        <View style={{ marginBottom: 12 }}>
          <ErrorBanner message={error} />
        </View>
      ) : null}
      <Button
        title="Sign in"
        onPress={() => void onSubmit()}
        loading={busy}
        disabled={busy || !email || !password}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.border,
    padding: 16,
    ...shadow.card,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: color.text,
    marginBottom: 4,
  },
  sub: {
    fontSize: 13,
    color: color.textSecondary,
    marginBottom: 16,
  },
})
