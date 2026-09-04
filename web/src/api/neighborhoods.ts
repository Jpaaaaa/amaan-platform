import { getAmanatToken } from '../lib/amanat-auth'

const AMANAT_API_URL = import.meta.env.VITE_AMANAT_API_URL ?? 'http://localhost:3000'

export type GeoJsonPolygon = {
  type: 'Polygon'
  coordinates: number[][][]
}

export type Neighborhood = {
  id: string
  name: string
  city: string
  boundary: GeoJsonPolygon | null
  centroidLat: number | null
  centroidLng: number | null
  createdAt: string
}

type ApiFail = { ok: false; unauthorized: boolean; error: string }
type ApiOk<T> = { ok: true; data: T }

async function parseErrorMessage(res: Response): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as { message?: string | string[] }
  if (typeof body.message === 'string') return body.message
  if (Array.isArray(body.message)) return body.message.join(', ')
  return res.statusText || 'Request failed'
}

async function neighborhoodsFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<ApiOk<T> | ApiFail> {
  const token = getAmanatToken()
  if (!token) {
    return { ok: false, unauthorized: true, error: 'Amanat sign-in required.' }
  }

  const { body, ...rest } = init
  const headers: HeadersInit = {
    ...(rest.headers ?? {}),
    Authorization: `Bearer ${token}`,
  }
  if (body != null) {
    ;(headers as Record<string, string>)['Content-Type'] = 'application/json'
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
  return { ok: true, data: (text ? JSON.parse(text) : undefined) as T }
}

export async function fetchNeighborhoods(city?: string) {
  const qs = city ? `?city=${encodeURIComponent(city)}` : ''
  return neighborhoodsFetch<Neighborhood[]>(`/neighborhoods${qs}`)
}

export async function createNeighborhood(body: {
  name: string
  city: string
  boundary: GeoJsonPolygon
}) {
  return neighborhoodsFetch<Neighborhood>('/neighborhoods', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function updateNeighborhood(
  id: string,
  body: { name?: string; boundary?: GeoJsonPolygon },
) {
  return neighborhoodsFetch<Neighborhood>(`/neighborhoods/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export async function deleteNeighborhood(id: string) {
  return neighborhoodsFetch<{ ok: true }>(`/neighborhoods/${id}`, { method: 'DELETE' })
}
