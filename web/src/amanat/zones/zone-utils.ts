import { L } from '../../lib/leaflet-setup'
import type { GeoJsonPolygon, Neighborhood } from '../../api/neighborhoods'

export const SLEMANI_CENTER: [number, number] = [35.556, 45.434]
export const DEFAULT_CITY = 'Sulaimaniyah'
export const MAP_ZOOM = 12

export function polygonToLatLngs(boundary: GeoJsonPolygon): [number, number][] {
  const ring = boundary.coordinates[0] ?? []
  return ring.map(([lng, lat]) => [lat, lng])
}

export function latLngsToGeoJson(positions: L.LatLng[]): GeoJsonPolygon {
  const ring = positions.map((p) => [p.lng, p.lat])
  if (ring.length > 0) {
    const first = ring[0]
    const last = ring[ring.length - 1]
    if (first[0] !== last[0] || first[1] !== last[1]) {
      ring.push([...first])
    }
  }
  return { type: 'Polygon', coordinates: [ring] }
}

export function geoJsonFromDrawLayer(layer: L.Layer): GeoJsonPolygon | null {
  if (!('getLatLngs' in layer)) return null
  const polygon = layer as L.Polygon
  const raw = polygon.getLatLngs()
  const ringLatLngs = (Array.isArray(raw[0]) ? raw[0] : raw) as L.LatLng[]
  if (!Array.isArray(ringLatLngs) || ringLatLngs.length < 3) return null
  return latLngsToGeoJson(ringLatLngs)
}

export function zoneBounds(zone: Neighborhood): L.LatLngBounds | null {
  if (!zone.boundary) return null
  const latLngs = polygonToLatLngs(zone.boundary)
  if (latLngs.length === 0) return null
  return L.latLngBounds(latLngs)
}
