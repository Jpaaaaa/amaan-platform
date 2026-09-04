const TOKEN_KEY = 'amanat_admin_token'

export function getAmanatToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setAmanatToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearAmanatToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function isAmanatAuthenticated(): boolean {
  return !!getAmanatToken()
}
