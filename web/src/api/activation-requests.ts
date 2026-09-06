import type { PlatformProductKey } from '@shared/platform-product'
import type { ActivationRequestRow, CustomUnit } from '../types/device'
import { parseOfflineGraceMs, unitToMs } from '../lib/device-form'
import { JSON_HEADERS, productQuery } from './platform'

export { JSON_HEADERS, productQuery }

export async function fetchActivationRequests(
  product: PlatformProductKey,
  status?: 'pending' | 'declined' | 'approved',
): Promise<
  { ok: true; requests: ActivationRequestRow[] } | { ok: false; unauthorized: boolean; error: string }
> {
  const statusQ = status ? `&status=${encodeURIComponent(status)}` : ''
  const r = await fetch(
    `/api/platform/admin/activation-requests${productQuery(product)}${statusQ}`,
    { credentials: 'include' },
  )
  if (r.status === 401) {
    return { ok: false, unauthorized: true, error: 'Sign in required.' }
  }
  if (!r.ok) {
    const j = (await r.json().catch(() => ({}))) as { error?: string }
    return { ok: false, unauthorized: false, error: j.error ?? r.statusText }
  }
  const j = (await r.json()) as { requests: ActivationRequestRow[] }
  return { ok: true, requests: j.requests ?? [] }
}

export type ApproveActivationInput = {
  product: PlatformProductKey
  machineId: string
  tier: string
  label?: string | null
  notes?: string | null
  customAmount?: string
  customUnit?: CustomUnit
  rollingDays: string
  rollingMinutes: string
  allowRevoked?: boolean
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
    return { ok: false, unauthorized: false, error: 'Offline grace: use whole numbers (days and minutes ≥ 0).' }
  }
  const r = await fetch(
    `/api/platform/admin/activation-requests/${encodeURIComponent(input.machineId)}/approve${productQuery(input.product)}`,
    {
      method: 'POST',
      headers: JSON_HEADERS,
      credentials: 'include',
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
  if (r.status === 401) return { ok: false, unauthorized: true, error: 'Sign in required.' }
  if (!r.ok) {
    const j = (await r.json().catch(() => ({}))) as { error?: string; message?: string }
    return {
      ok: false,
      unauthorized: false,
      error: j.message ?? j.error ?? r.statusText,
      errorCode: j.error,
    }
  }
  return { ok: true }
}

export async function declineActivationRequest(
  product: PlatformProductKey,
  machineId: string,
  reason?: string | null,
): Promise<{ ok: true } | { ok: false; unauthorized: boolean; error: string }> {
  const r = await fetch(
    `/api/platform/admin/activation-requests/${encodeURIComponent(machineId)}/decline${productQuery(product)}`,
    {
      method: 'POST',
      headers: JSON_HEADERS,
      credentials: 'include',
      body: JSON.stringify(reason != null && reason !== '' ? { reason } : {}),
    },
  )
  if (r.status === 401) return { ok: false, unauthorized: true, error: 'Sign in required.' }
  if (!r.ok) {
    const j = (await r.json().catch(() => ({}))) as { error?: string; message?: string }
    return { ok: false, unauthorized: false, error: j.message ?? j.error ?? r.statusText }
  }
  return { ok: true }
}

export async function deleteActivationRequest(
  product: PlatformProductKey,
  machineId: string,
): Promise<{ ok: true } | { ok: false; unauthorized: boolean; error: string }> {
  const r = await fetch(
    `/api/platform/admin/activation-requests/${encodeURIComponent(machineId)}${productQuery(product)}`,
    { method: 'DELETE', credentials: 'include' },
  )
  if (r.status === 401) return { ok: false, unauthorized: true, error: 'Sign in required.' }
  if (!r.ok) {
    const j = (await r.json().catch(() => ({}))) as { error?: string }
    return { ok: false, unauthorized: false, error: j.error ?? r.statusText }
  }
  return { ok: true }
}
