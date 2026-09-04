import { getAmanatToken } from '../lib/amanat-auth'

const AMANAT_API_URL = import.meta.env.VITE_AMANAT_API_URL ?? 'http://localhost:3000'

export type PaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED'

export type AdminAccountUser = {
  id: string
  email: string
  fullName: string
  role: string
  officeName?: string | null
}

export type ResetPasswordResult = {
  email: string
  fullName: string
  newPassword: string
}

export type SubscriptionListItem = {
  id: string
  tier: string
  paymentStatus: PaymentStatus
  startsAt: string | null
  endsAt: string | null
  notes: string | null
  createdAt: string
  accountName: string
  accountType: 'company' | 'office' | 'individual'
  isLocked: boolean
  expiringSoon: boolean
  minAgents: number
  maxAgents: number
  agentsCount: number
}

export type AdminAccountDetail = {
  id: string
  tier: string
  paymentStatus: PaymentStatus
  startsAt: string | null
  endsAt: string | null
  notes: string | null
  accountName: string
  accountType: 'company' | 'office' | 'individual'
  isLocked: boolean
  minAgents: number
  maxAgents: number
  agentsCount: number
  joinCode: string | null
  accountUsers: AdminAccountUser[]
}

export type AmanatLoginResponse = {
  accessToken: string
  user: { id: string; email: string; fullName: string; role: string }
}

type ApiFail = { ok: false; unauthorized: boolean; error: string }
type ApiOk<T> = { ok: true; data: T }

async function parseErrorMessage(res: Response): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as { message?: string | string[] }
  if (typeof body.message === 'string') return body.message
  if (Array.isArray(body.message)) return body.message.join(', ')
  return res.statusText || 'Request failed'
}

async function amanatFetch<T>(
  path: string,
  init: RequestInit & { token?: string | null } = {},
): Promise<ApiOk<T> | ApiFail> {
  const { token, body, ...rest } = init
  const headers: HeadersInit = { ...(rest.headers ?? {}) }
  if (body != null) {
    ;(headers as Record<string, string>)['Content-Type'] = 'application/json'
  }
  const bearer = token ?? getAmanatToken()
  if (bearer) {
    ;(headers as Record<string, string>)['Authorization'] = `Bearer ${bearer}`
  }

  let res: Response
  try {
    res = await fetch(`${AMANAT_API_URL}${path}`, { ...rest, body, headers })
  } catch {
    return { ok: false, unauthorized: false, error: 'Could not reach Amanat API.' }
  }

  if (res.status === 401) {
    return { ok: false, unauthorized: true, error: 'Amanat sign-in required.' }
  }
  if (!res.ok) {
    return { ok: false, unauthorized: false, error: await parseErrorMessage(res) }
  }

  if (res.status === 204) {
    return { ok: true, data: undefined as T }
  }

  const text = await res.text()
  const data = (text ? JSON.parse(text) : undefined) as T
  return { ok: true, data }
}

export async function amanatLogin(
  email: string,
  password: string,
): Promise<ApiOk<AmanatLoginResponse> | ApiFail> {
  return amanatFetch<AmanatLoginResponse>('/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    token: null,
  })
}

export async function fetchAmanatSubscriptions(): Promise<
  ApiOk<SubscriptionListItem[]> | ApiFail
> {
  const qs = new URLSearchParams({ sortBy: 'endsAt', order: 'asc' })
  return amanatFetch<SubscriptionListItem[]>(`/admin/subscriptions?${qs}`)
}

export async function fetchAmanatAccount(
  id: string,
): Promise<ApiOk<AdminAccountDetail> | ApiFail> {
  return amanatFetch<AdminAccountDetail>(`/admin/accounts/${id}`)
}

export async function approveAmanatSubscription(
  id: string,
  startsAt: string,
  endsAt: string,
): Promise<ApiOk<unknown> | ApiFail> {
  return amanatFetch(`/admin/subscriptions/${id}/approve`, {
    method: 'PATCH',
    body: JSON.stringify({ startsAt, endsAt }),
  })
}

export async function rejectAmanatSubscription(
  id: string,
  notes?: string,
): Promise<ApiOk<unknown> | ApiFail> {
  return amanatFetch(`/admin/subscriptions/${id}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ notes }),
  })
}

export async function suspendAmanatAccount(id: string): Promise<ApiOk<unknown> | ApiFail> {
  return amanatFetch(`/admin/accounts/${id}/suspend`, {
    method: 'PATCH',
    body: JSON.stringify({}),
  })
}

export async function unlockAmanatAccount(id: string): Promise<ApiOk<unknown> | ApiFail> {
  return amanatFetch(`/admin/accounts/${id}/unlock`, {
    method: 'PATCH',
    body: JSON.stringify({}),
  })
}

export async function deleteAmanatAccount(
  id: string,
): Promise<ApiOk<{ deleted: true; accountName: string }> | ApiFail> {
  return amanatFetch(`/admin/accounts/${id}`, { method: 'DELETE' })
}

export async function resetAmanatUserPassword(
  subscriptionId: string,
  userId: string,
): Promise<ApiOk<ResetPasswordResult> | ApiFail> {
  return amanatFetch<ResetPasswordResult>(
    `/admin/accounts/${subscriptionId}/users/${userId}/reset-password`,
    { method: 'POST', body: JSON.stringify({}) },
  )
}
