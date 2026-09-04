import { useEffect, useRef } from 'react'
import { MapContainer, Polygon, TileLayer, useMap } from 'react-leaflet'
import 'leaflet-draw'
import '../../lib/leaflet-setup'
import { L } from '../../lib/leaflet-setup'
import type { GeoJsonPolygon, Neighborhood } from '../../api/neighborhoods'
import {
  geoJsonFromDrawLayer,
  MAP_ZOOM,
  polygonToLatLngs,
  SLEMANI_CENTER,
  zoneBounds,
} from './zone-utils'

function FlyToSelection({
  zones,
  selectedId,
}: {
  zones: Neighborhood[]
  selectedId: string | null
}) {
  const map = useMap()

  useEffect(() => {
    if (!selectedId) return
    const zone = zones.find((z) => z.id === selectedId)
    if (!zone) return
    const bounds = zoneBounds(zone)
    if (bounds) {
      map.flyToBounds(bounds, { padding: [24, 24] })
    }
  }, [map, selectedId, zones])

  return null
}

function DrawControl({ onDrawComplete }: { onDrawComplete: (boundary: GeoJsonPolygon) => void }) {
  const map = useMap()
  const onDrawCompleteRef = useRef(onDrawComplete)

  useEffect(() => {
    onDrawCompleteRef.current = onDrawComplete
  }, [onDrawComplete])

  useEffect(() => {
    const drawControl = new L.Control.Draw({
      position: 'topright',
      draw: {
        polygon: { allowIntersection: false, showArea: false },
        polyline: false,
        rectangle: false,
        circle: false,
        marker: false,
        circlemarker: false,
      },
      edit: {
        featureGroup: new L.FeatureGroup(),
        edit: false,
        remove: false,
      },
    })

    map.addControl(drawControl)

    function handleCreated(event: L.LeafletEvent) {
      const created = event as L.DrawEvents.Created
      if (created.layerType !== 'polygon') return
      const boundary = geoJsonFromDrawLayer(created.layer)
      if (boundary) onDrawCompleteRef.current(boundary)
    }

    map.on(L.Draw.Event.CREATED, handleCreated)

    return () => {
      map.off(L.Draw.Event.CREATED, handleCreated)
      map.removeControl(drawControl)
    }
  }, [map])

  return null
}

export function ZoneMap({
  zones,
  draftBoundary,
  selectedId,
  onSelect,
  onDrawComplete,
}: {
  zones: Neighborhood[]
  draftBoundary: GeoJsonPolygon | null
  selectedId: string | null
  onSelect: (id: string) => void
  onDrawComplete: (boundary: GeoJsonPolygon) => void
}) {
  const draftPositions = draftBoundary ? polygonToLatLngs(draftBoundary) : null

  return (
    <div className="h-[min(52vh,420px)] overflow-hidden rounded-2xl border border-obsidian-border">
      <MapContainer center={SLEMANI_CENTER} zoom={MAP_ZOOM} className="h-full w-full" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FlyToSelection zones={zones} selectedId={selectedId} />
        <DrawControl onDrawComplete={onDrawComplete} />
        {draftPositions && (
          <Polygon
            positions={draftPositions}
            pathOptions={{
              color: '#ea580c',
              weight: 3,
              dashArray: '8 6',
              fillColor: '#f97316',
              fillOpacity: 0.25,
            }}
          />
        )}
        {zones.map((zone) => {
          if (!zone.boundary) return null
          const positions = polygonToLatLngs(zone.boundary)
          const isSelected = zone.id === selectedId
          return (
            <Polygon
              key={zone.id}
              positions={positions}
              pathOptions={{
                color: isSelected ? '#2563eb' : '#64748b',
                weight: isSelected ? 3 : 2,
                fillColor: isSelected ? '#3b82f6' : '#94a3b8',
                fillOpacity: isSelected ? 0.35 : 0.2,
              }}
              eventHandlers={{ click: () => onSelect(zone.id) }}
            />
          )
        })}
      </MapContainer>
    </div>
  )
}
