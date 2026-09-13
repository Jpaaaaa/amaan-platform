import AsyncStorage from '@react-native-async-storage/async-storage'
import type {
  ActivationRequestRow,
  ApproveActivationInput,
  CreateDeviceInput,
  DeviceRow,
  PatchDeviceInput,
  PlatformProductKey,
  PlatformUpdateFilesResponse,
} from '../types'
import { parseOfflineGraceMs } from '../utils/offlineGrace'
import { unitToMs } from '../lib/device-form'

export const API_BASE_URL = 'https://bazarone.amaantechnology.com'
const TOKEN_KEY = '@amaan_platform_token'

const JSON_HEADERS: Record<string, string> = { 'Content-Type': 'application/json' }

function productQuery(p: PlatformProductKey): string {
  return `?product=${encodeURIComponent(p)}`
}

export async function getStoredToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY)
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<
  | { ok: true; data: T }
  | { ok: false; status: number; unauthorized: boolean; error: string; code?: string }
> {
  const token = await getStoredToken()
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(init.body ? JSON_HEADERS : {}),
    ...(init.headers as Record<string, string> | undefined),
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers })
  if (res.status === 401) {
    return { ok: false, status: 401, unauthorized: true, error: 'Sign in required.' }
  }
  if (!res.ok) {
    const text = await res.text()
    let error = text || res.statusText
    let code: string | undefined
    try {
      const j = JSON.parse(text) as { error?: string; message?: string }
      code = j.error
      error = j.message ?? j.error ?? error
    } catch {
      /* keep text */
    }
    return { ok: false, status: res.status, unauthorized: false, error, code }
  }
  const data = (await res.json()) as T
  return { ok: true, data }
}

export async function login(
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/platform/auth/login`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ password }),
    })
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string }
      const msg =
        j.error === 'INVALID_CREDENTIALS' ? 'Invalid password.' : res.statusText
      return { ok: false, error: msg }
    }
    const j = (await res.json()) as { ok?: boolean; token?: string }
    if (!j.token) {
      return { ok: false, error: 'Server did not return a token.' }
    }
    await AsyncStorage.setItem(TOKEN_KEY, j.token)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

export async function logout(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY)
}

export function getApiBaseUrl(): string {
  return API_BASE_URL
}

export async function getDevices(
  product: PlatformProductKey,
): Promise<
  | { ok: true; devices: DeviceRow[] }
  | { ok: false; unauthorized: boolean; error: string }
> {
  const r = await request<{ devices: DeviceRow[] }>(
    `/api/platform/admin/devices${productQuery(product)}`,
  )
  if (!r.ok) {
    return { ok: false, unauthorized: r.unauthorized, error: r.error }
  }
  return { ok: true, devices: r.data.devices ?? [] }
}

export async function createDevice(
  input: CreateDeviceInput,
): Promise<{ ok: true } | { ok: false; unauthorized: boolean; error: string }> {
  let customValidForMs: number | undefined
  if (input.tier === 'custom') {
    const amt = Number(String(input.customAmount ?? '').trim().replace(',', '.'))
    if (!Number.isFinite(amt) || amt <= 0) {
      return { ok: false, unauthorized: false, error: 'Enter a positive number.' }
    }
    customValidForMs = unitToMs(amt, input.customUnit ?? 'days')
  }
  const rollingParsed = parseOfflineGraceMs(
    input.rollingDays ?? '',
    input.rollingMinutes ?? '',
  )
  if (rollingParsed === 'err') {
    return {
      ok: false,
      unauthorized: false,
      error: 'Offline grace: use whole numbers (days and minutes ≥ 0).',
    }
  }
  const r = await request<unknown>('/api/platform/admin/devices', {
    method: 'POST',
    body: JSON.stringify({
      product: input.product,
      machineId: input.machineId.trim(),
      label: input.label,
      tier: input.tier,
      renew: input.renew,
      notes: input.notes,
      ...(customValidForMs != null ? { customValidForMs } : {}),
      ...(rollingParsed !== null ? { rollingMaxMs: rollingParsed } : {}),
    }),
  })
  if (!r.ok) {
    return { ok: false, unauthorized: r.unauthorized, error: r.error }
  }
  return { ok: true }
}

export async function updateDevice(
  input: PatchDeviceInput,
): Promise<{ ok: true } | { ok: false; unauthorized: boolean; error: string }> {
  const r = await request<unknown>(
    `/api/platform/admin/devices/${encodeURIComponent(input.machineId)}${productQuery(input.product)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        label: input.label,
        notes: input.notes,
        tier: input.tier,
        expiresAtMs: input.expiresAtMs,
        lastSyncAtMs: input.lastSyncAtMs,
        rollingMaxMs: input.rollingMaxMs,
      }),
    },
  )
  if (!r.ok) {
    return { ok: false, unauthorized: r.unauthorized, error: r.error }
  }
  return { ok: true }
}

export async function deleteDevice(
  product: PlatformProductKey,
  machineId: string,
): Promise<{ ok: true } | { ok: false; unauthorized: boolean; error: string }> {
  const r = await request<unknown>(
    `/api/platform/admin/devices/${encodeURIComponent(machineId)}${productQuery(product)}`,
    { method: 'DELETE' },
  )
  if (!r.ok) {
    return { ok: false, unauthorized: r.unauthorized, error: r.error }
  }
  return { ok: true }
}

export async function revokeDevice(
  product: PlatformProductKey,
  machineId: string,
  revoked: boolean,
): Promise<{ ok: true } | { ok: false; unauthorized: boolean; error: string }> {
  const r = await request<unknown>(
    `/api/platform/admin/devices/${encodeURIComponent(machineId)}/revoke${productQuery(product)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ revoked }),
    },
  )
  if (!r.ok) {
    return { ok: false, unauthorized: r.unauthorized, error: r.error }
  }
  return { ok: true }
}

export async function getActivationRequests(
  product: PlatformProductKey,
  status?: 'pending' | 'declined' | 'approved',
): Promise<
  | { ok: true; requests: ActivationRequestRow[] }
  | { ok: false; unauthorized: boolean; error: string }
> {
  const statusQ = status ? `&status=${encodeURIComponent(status)}` : ''
  const r = await request<{ requests: ActivationRequestRow[] }>(
    `/api/platform/admin/activation-requests${productQuery(product)}${statusQ}`,
  )
  if (!r.ok) {
    return { ok: false, unauthorized: r.unauthorized, error: r.error }
  }
  return { ok: true, requests: r.data.requests ?? [] }
}

export async function approveActivationRequest(
  input: ApproveActivationInput,
): Promise<
  | { ok: true }
  | { ok: false; unauthorized: boolean; error: string; errorCode?: string }
> {
  let customValidForMs: number | undefined
  if (input.tier === 'custom') {
    const amt = Number(String(input.customAmount ?? '').trim().replace(',', '.'))
    if (!Number.isFinite(amt) || amt <= 0) {
      return { ok: false, unauthorized: false, error: 'Enter a positive number.' }
    }
    customValidForMs = unitToMs(amt, input.customUnit ?? 'days')
  }
  const rollingParsed = parseOfflineGraceMs(input.rollingDays, input.rollingMinutes)
  if (rollingParsed === 'err') {
    return {
      ok: false,
      unauthorized: false,
      error: 'Offline grace: use whole numbers (days and minutes ≥ 0).',
    }
  }
  const r = await request<unknown>(
    `/api/platform/admin/activation-requests/${encodeURIComponent(input.machineId)}/approve${productQuery(input.product)}`,
    {
      method: 'POST',
      body: JSON.stringify({
        tier: input.tier,
        ...(input.label !== undefined ? { label: input.label } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        ...(customValidForMs != null ? { customValidForMs } : {}),
        ...(rollingParsed !== null ? { rollingMaxMs: rollingParsed } : {}),
        ...(input.allowRevoked ? { allowRevoked: true } : {}),
      }),
    },
  )
  if (!r.ok) {
    return {
      ok: false,
      unauthorized: r.unauthorized,
      error: r.error,
      errorCode: r.code,
    }
  }
  return { ok: true }
}

export async function declineActivationRequest(
  product: PlatformProductKey,
  machineId: string,
  reason?: string | null,
): Promise<{ ok: true } | { ok: false; unauthorized: boolean; error: string }> {
  const r = await request<unknown>(
    `/api/platform/admin/activation-requests/${encodeURIComponent(machineId)}/decline${productQuery(product)}`,
    {
      method: 'POST',
      body: JSON.stringify(reason != null && reason !== '' ? { reason } : {}),
    },
  )
  if (!r.ok) {
    return { ok: false, unauthorized: r.unauthorized, error: r.error }
  }
  return { ok: true }
}

export async function deleteActivationRequest(
  product: PlatformProductKey,
  machineId: string,
): Promise<{ ok: true } | { ok: false; unauthorized: boolean; error: string }> {
  const r = await request<unknown>(
    `/api/platform/admin/activation-requests/${encodeURIComponent(machineId)}${productQuery(product)}`,
    { method: 'DELETE' },
  )
  if (!r.ok) {
    return { ok: false, unauthorized: r.unauthorized, error: r.error }
  }
  return { ok: true }
}

export async function getReleases(
  product: PlatformProductKey,
): Promise<
  | { ok: true; releases: PlatformUpdateFilesResponse }
  | { ok: false; unauthorized: boolean; error: string }
> {
  const r = await request<PlatformUpdateFilesResponse>(
    `/api/platform/admin/updates/files${productQuery(product)}`,
  )
  if (!r.ok) {
    return { ok: false, unauthorized: r.unauthorized, error: r.error }
  }
  return { ok: true, releases: r.data }
}
