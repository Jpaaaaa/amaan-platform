import AsyncStorage from '@react-native-async-storage/async-storage'

const TOKEN_KEY = '@amaan_amanat_token'

export async function getAmanatToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY)
}

export async function setAmanatToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token)
}

export async function clearAmanatToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY)
}

export async function isAmanatAuthenticated(): Promise<boolean> {
  const token = await getAmanatToken()
  return Boolean(token)
}
