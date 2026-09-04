import type { PlatformLicenseTier } from '../shared/types/platform-devices.js'
import { assertTier } from './platform-device-tier.js'

/** Own-property check + coerce string JSON numbers (some proxies/clients send strings). */
export function readRollingMaxMsFromBody(body: unknown): { v: number | null | undefined; err?: string } {
  if (body == null || typeof body !== 'object') return { v: undefined }
  if (!Object.prototype.hasOwnProperty.call(body, 'rollingMaxMs')) return { v: undefined }
  const raw = (body as Record<string, unknown>).rollingMaxMs
  if (raw === null) return { v: null }
  if (typeof raw === 'number' && Number.isFinite(raw)) return { v: raw }
  if (typeof raw === 'string' && raw.trim() !== '') {
    const n = Number(raw.trim())
    if (Number.isFinite(n)) return { v: n }
  }
  return { v: undefined, err: 'rollingMaxMs must be a finite number or null' }
}

export type DeviceActivationInput =
  | {
      ok: true
      tier: PlatformLicenseTier
      customValidForMs?: number
      rollingMaxMs?: number | null
      label?: string | null
      notes?: string | null
    }
  | { ok: false; error: string; message?: string }

export function parseDeviceActivationInput(
  body: unknown,
  opts: { isNew: boolean },
): DeviceActivationInput {
  if (body == null || typeof body !== 'object') {
    return { ok: false, error: 'VALIDATION', message: 'tier required' }
  }
  const o = body as Record<string, unknown>
  const tierRaw = typeof o.tier === 'string' ? o.tier.trim() : ''
  if (!tierRaw) {
    return { ok: false, error: 'VALIDATION', message: 'tier required' }
  }
  try {
    assertTier(tierRaw)
  } catch {
    return { ok: false, error: 'INVALID_TIER' }
  }

  const rawCustom = o.customValidForMs
  const customValidForMs =
    typeof rawCustom === 'number' && Number.isFinite(rawCustom) ? rawCustom : undefined

  const rollingRead = readRollingMaxMsFromBody(body)
  if (rollingRead.err) {
    return { ok: false, error: 'VALIDATION', message: rollingRead.err }
  }

  if (opts.isNew && tierRaw === 'custom') {
    if (customValidForMs == null || customValidForMs <= 0) {
      return {
        ok: false,
        error: 'VALIDATION',
        message: 'customValidForMs (positive ms) required for custom tier when activating or renewing',
      }
    }
  }

  const out: Extract<DeviceActivationInput, { ok: true }> = {
    ok: true,
    tier: tierRaw as PlatformLicenseTier,
    customValidForMs,
    rollingMaxMs: rollingRead.v,
  }

  if ('label' in o) {
    out.label = o.label === null ? null : String(o.label)
  }
  if ('notes' in o) {
    out.notes = o.notes === null ? null : String(o.notes)
  }

  return out
}

function defaultNotesFromStore(phone: string | null, ownerContactName: string | null): string | null {
  const parts: string[] = []
  if (phone != null && phone.trim()) parts.push(phone.trim())
  if (ownerContactName != null && ownerContactName.trim()) parts.push(ownerContactName.trim())
  if (parts.length === 0) return null
  return parts.join(' · ')
}

export function resolveApproveDeviceFields(
  request: { store: { storeName: string; phone: string | null; ownerContactName: string | null } },
  parsed: Extract<DeviceActivationInput, { ok: true }>,
): { label: string | null; notes: string | null } {
  const label = parsed.label !== undefined ? parsed.label : request.store.storeName
  const notes =
    parsed.notes !== undefined
      ? parsed.notes
      : defaultNotesFromStore(request.store.phone, request.store.ownerContactName)
  return { label, notes }
}
