import type { PlatformProductKey } from '@shared/platform-product'
import type { CustomUnit, DeviceRow } from '../types/device'
import { parseOfflineGraceMs, unitToMs } from '../lib/device-form'

export const JSON_HEADERS: HeadersInit = { 'Content-Type': 'application/json' }

export function productQuery(p: PlatformProductKey): string {
  return `?product=${encodeURIComponent(p)}`
}

export type AuthMeResponse = { authEnabled?: boolean; ok?: boolean }

export async function fetchAuthMe(): Promise<AuthMeResponse> {
  const res = await fetch('/api/platform/auth/me', { credentials: 'include' })
  return (await res.json()) as AuthMeResponse
}

export async function fetchDevices(product: PlatformProductKey): Promise<
  { ok: true; devices: DeviceRow[] } | { ok: false; unauthorized: boolean; error: string }
> {
  const r = await fetch(`/api/platform/admin/devices${productQuery(product)}`, { credentials: 'include' })
  if (r.status === 401) {
    return { ok: false, unauthorized: true, error: 'Sign in required.' }
  }
  if (!r.ok) {
    const j = (await r.json().catch(() => ({}))) as { error?: string }
    return { ok: false, unauthorized: false, error: j.error ?? r.statusText }
  }
  const j = (await r.json()) as { devices: DeviceRow[] }
  return { ok: true, devices: j.devices ?? [] }
}

export type CreateDeviceInput = {
  product: PlatformProductKey
  machineId: string
  label: string | null
  tier: string
  renew: boolean
  notes: string | null
  customAmount?: string
  customUnit?: CustomUnit
  rollingDays: string
  rollingMinutes: string
}

export async function createDevice(input: CreateDeviceInput): Promise<
  { ok: true } | { ok: false; unauthorized: boolean; error: string }
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
    return { ok: false, unauthorized: false, error: 'Offline grace: use whole numbers (days and minutes ≥ 0).' }
  }
  const r = await fetch('/api/platform/admin/devices', {
    method: 'POST',
    headers: JSON_HEADERS,
    credentials: 'include',
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
  if (r.status === 401) return { ok: false, unauthorized: true, error: 'Sign in required.' }
  if (!r.ok) {
    const j = (await r.json().catch(() => ({}))) as { error?: string; message?: string }
    return { ok: false, unauthorized: false, error: j.message ?? j.error ?? r.statusText }
  }
  return { ok: true }
}

export async function toggleRevokeDevice(
  product: PlatformProductKey,
  machineId: string,
  revoked: boolean,
): Promise<{ ok: true } | { ok: false; unauthorized: boolean; error: string }> {
  const r = await fetch(
    `/api/platform/admin/devices/${encodeURIComponent(machineId)}/revoke${productQuery(product)}`,
    {
      method: 'PATCH',
      headers: JSON_HEADERS,
      credentials: 'include',
      body: JSON.stringify({ revoked: !revoked }),
    },
  )
  if (r.status === 401) return { ok: false, unauthorized: true, error: 'Sign in required.' }
  if (!r.ok) return { ok: false, unauthorized: false, error: await r.text() }
  return { ok: true }
}

export type PatchDeviceInput = {
  product: PlatformProductKey
  machineId: string
  label: string | null
  notes: string | null
  tier: string
  expiresAtMs: number | null
  lastSyncAtMs: number | null
  rollingMaxMs: number | null
}

export async function patchDevice(input: PatchDeviceInput): Promise<
  { ok: true } | { ok: false; unauthorized: boolean; error: string }
> {
  const r = await fetch(
    `/api/platform/admin/devices/${encodeURIComponent(input.machineId)}${productQuery(input.product)}`,
    {
      method: 'PATCH',
      headers: JSON_HEADERS,
      credentials: 'include',
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
  if (r.status === 401) return { ok: false, unauthorized: true, error: 'Sign in required.' }
  if (!r.ok) {
    const j = (await r.json().catch(() => ({}))) as { error?: string; message?: string }
    return { ok: false, unauthorized: false, error: j.message ?? j.error ?? r.statusText }
  }
  return { ok: true }
}

export async function deleteDevice(
  product: PlatformProductKey,
  machineId: string,
): Promise<{ ok: true } | { ok: false; unauthorized: boolean; error: string }> {
  const r = await fetch(
    `/api/platform/admin/devices/${encodeURIComponent(machineId)}${productQuery(product)}`,
    { method: 'DELETE', credentials: 'include' },
  )
  if (r.status === 401) return { ok: false, unauthorized: true, error: 'Sign in required.' }
  if (!r.ok) return { ok: false, unauthorized: false, error: (await r.text()) || r.statusText }
  return { ok: true }
}

export async function logout(): Promise<void> {
  await fetch('/api/platform/auth/logout', { method: 'POST', credentials: 'include' })
}
