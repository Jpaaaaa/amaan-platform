import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { clearAmanatToken, isAmanatAuthenticated } from '../lib/amanat-auth'
import { color } from '../theme'
import { AmanatLoginForm } from './AmanatLoginForm'

type Session = {
  signOut: () => Promise<void>
}

export function AmanatGate({
  children,
  padded = true,
}: {
  children: (session: Session) => ReactNode
  padded?: boolean
}) {
  const [authed, setAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    void isAmanatAuthenticated().then(setAuthed)
  }, [])

  const signOut = useCallback(async () => {
    await clearAmanatToken()
    setAuthed(false)
  }, [])

  if (authed == null) {
    return <ActivityIndicator color={color.brand} style={{ marginTop: 48 }} />
  }

  if (!authed) {
    return (
      <View style={padded ? { paddingHorizontal: 16 } : undefined}>
        <AmanatLoginForm onLoggedIn={() => setAuthed(true)} />
      </View>
    )
  }

  return <>{children({ signOut })}</>
}
