import { useState } from 'react'
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { login } from '../api/client'
import { Button } from '../components/ui/Button'
import { ErrorBanner } from '../components/ui/ErrorBanner'
import { TextField } from '../components/ui/TextField'
import { color } from '../theme'

type Props = {
  onLoggedIn: () => void
}

export function LoginScreen({ onLoggedIn }: Props) {
  const insets = useSafeAreaInsets()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onLogin() {
    setBusy(true)
    setError(null)
    const result = await login(password)
    setBusy(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    onLoggedIn()
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <View style={styles.brand}>
          <View style={styles.logoWrap}>
            <Image
              source={require('../../public/amanlogo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>Amaan</Text>
          <Text style={styles.subtitle}>Sign in to the company workspace</Text>
        </View>

        <View style={styles.card}>
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
              if (password && !busy) void onLogin()
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
            onPress={() => void onLogin()}
            loading={busy}
            disabled={busy || !password}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: color.bg,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  inner: {
    width: '100%',
  },
  brand: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoWrap: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  logo: {
    width: 40,
    height: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: color.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: color.textSecondary,
    marginTop: 6,
  },
  card: {
    backgroundColor: color.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: color.border,
  },
})
